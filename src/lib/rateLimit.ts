import { NextRequest } from 'next/server';
import redis from './redis';

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetTime: Date;
};

/**
 * Core rate limiting function using Redis INCR and EXPIRE.
 * Uses a fixed-window approach for simplicity and performance on Edge.
 */
export async function rateLimit(
  req: NextRequest,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  const redisKey = `ratelimit:${key}:${ip}`;

  const currentCount = await redis.incr(redisKey);
  
  if (currentCount === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  const ttl = await redis.ttl(redisKey);
  const resetTime = new Date(Date.now() + ttl * 1000);
  const remaining = Math.max(0, maxRequests - currentCount);

  return {
    success: currentCount <= maxRequests,
    remaining,
    resetTime,
  };
}

// ─── Pre-configured Limiters ─────────────────────────────────────────────────

export async function authRateLimit(req: NextRequest): Promise<RateLimitResult> {
  // 5 requests per 15 minutes per IP
  return rateLimit(req, 'auth', 5, 15 * 60);
}

export async function apiRateLimit(req: NextRequest, userId: string = 'public'): Promise<RateLimitResult> {
  // 100 requests per 1 minute per IP/User
  return rateLimit(req, `api:${userId}`, 100, 60);
}

export async function uploadRateLimit(req: NextRequest, userId: string): Promise<RateLimitResult> {
  // 10 requests per 5 minutes per User
  return rateLimit(req, `upload:${userId}`, 10, 5 * 60);
}
