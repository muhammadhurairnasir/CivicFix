import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

// ─── Singleton Safe for Next.js HMR ─────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null;
}

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (redisClient) return redisClient;
  if (global.__redis) {
    redisClient = global.__redis;
    return redisClient;
  }

  if (!REDIS_URL || REDIS_URL.includes('<')) {
    console.warn('[Redis] No valid REDIS_URL found. Using in-memory mock for development.');
    
    // In-memory mock for Redis
    const memoryStore = new Map<string, string>();
    const mockRedis = {
      get: async (key: string) => memoryStore.get(key) || null,
      set: async (key: string, value: string, ...args: any[]) => {
        memoryStore.set(key, value);
        return 'OK';
      },
      del: async (key: string) => {
        memoryStore.delete(key);
        return 1;
      },
      incr: async (key: string) => {
        const val = memoryStore.get(key);
        const num = val ? parseInt(val, 10) + 1 : 1;
        memoryStore.set(key, num.toString());
        return num;
      },
      expire: async (key: string, ttl: number) => {
        // Simple mock, no actual expiration logic
        return 1;
      },
      on: (event: string, handler: any) => {},
    };

    return mockRedis as unknown as Redis;
  }

  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__redis = redisClient;
  }

  redisClient.on('error', (err) => {
    console.error('[Redis] ❌ Connection Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.info('[Redis] ✅ Connected');
  });

  return redisClient;
}

// Default export for generic use cases (lazy proxy or fallback)
const defaultRedis = new Proxy({} as Redis, {
  get(_, prop) {
    const client = getRedis();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
export default defaultRedis;

// ─── Typed Helpers ─────────────────────────────────────────────────────────────

// Refresh Tokens
export async function setRefreshToken(userId: string, hashedToken: string, ttlSeconds: number): Promise<void> {
  await getRedis().set(`auth:refresh:${userId}`, hashedToken, 'EX', ttlSeconds);
}

export async function getRefreshToken(userId: string): Promise<string | null> {
  return getRedis().get(`auth:refresh:${userId}`);
}

export async function deleteRefreshToken(userId: string): Promise<void> {
  await getRedis().del(`auth:refresh:${userId}`);
}

// Email Verification
export async function setEmailVerifyToken(email: string, token: string, ttlSeconds: number = 86400): Promise<void> {
  await getRedis().set(`auth:verify:${email.toLowerCase()}`, token, 'EX', ttlSeconds);
}

export async function getEmailVerifyToken(email: string): Promise<string | null> {
  return getRedis().get(`auth:verify:${email.toLowerCase()}`);
}

export async function deleteEmailVerifyToken(email: string): Promise<void> {
  await getRedis().del(`auth:verify:${email.toLowerCase()}`);
}

// Password Reset
export async function setPasswordResetToken(email: string, token: string, ttlSeconds: number = 3600): Promise<void> {
  await getRedis().set(`auth:reset:${email.toLowerCase()}`, token, 'EX', ttlSeconds);
}

export async function getPasswordResetToken(email: string): Promise<string | null> {
  return getRedis().get(`auth:reset:${email.toLowerCase()}`);
}

export async function deletePasswordResetToken(email: string): Promise<void> {
  await getRedis().del(`auth:reset:${email.toLowerCase()}`);
}

// Rate Limiting (Brute Force Protection)
export async function setRateLimit(key: string, ttlSeconds: number): Promise<void> {
  await getRedis().set(`ratelimit:${key}`, '1', 'EX', ttlSeconds);
}

export async function getRateLimit(key: string): Promise<number> {
  const val = await getRedis().get(`ratelimit:${key}`);
  return val ? parseInt(val, 10) : 0;
}

export async function incrementRateLimit(key: string, ttlSeconds: number): Promise<number> {
  const current = await getRedis().incr(`ratelimit:${key}`);
  if (current === 1) {
    await getRedis().expire(`ratelimit:${key}`, ttlSeconds);
  }
  return current;
}
