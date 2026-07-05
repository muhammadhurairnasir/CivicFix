import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';

// Validation is deferred to connectDB() so Next.js can still
// compile and render pages that don't require a DB connection.

// ─── Global Cache (HMR-safe across Next.js hot reloads) ──────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cached;

// ─── Connection Options ───────────────────────────────────────────────────────

const CONNECT_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  family: 4,
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function attachConnectionListeners(): void {
  mongoose.connection.on('connected', () => {
    console.info('[MongoDB] ✅ Connected to database');
  });

  mongoose.connection.on('error', (err: Error) => {
    console.error('[MongoDB] ❌ Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] ⚠️  Disconnected from database');
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on('reconnected', () => {
    console.info('[MongoDB] 🔄 Reconnected to database');
  });
}

// ─── Connect ─────────────────────────────────────────────────────────────────

async function attemptConnect(attempt: number): Promise<typeof mongoose> {
  try {
    console.info(`[MongoDB] Connecting… (attempt ${attempt}/${MAX_RETRIES})`);
    const instance = await mongoose.connect(MONGODB_URI, CONNECT_OPTIONS);
    return instance;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(
        `[MongoDB] Connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s…`,
        (err as Error).message,
      );
      await sleep(RETRY_DELAY_MS);
      return attemptConnect(attempt + 1);
    }
    throw new Error(
      `[MongoDB] Failed to connect after ${MAX_RETRIES} attempts: ${(err as Error).message}`,
    );
  }
}

/**
 * Connects to MongoDB with global caching so a single connection is reused
 * across Next.js API routes and Server Components, even during HMR.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  // Guard: if URI is missing or still a placeholder, fail fast with a clear error
  // (rather than returning bare mongoose and waiting 10s for a buffering timeout)
  if (!MONGODB_URI || MONGODB_URI.includes('<')) {
    throw new Error('DB_NOT_CONFIGURED');
  }

  if (!cached.promise) {
    attachConnectionListeners();
    cached.promise = attemptConnect(1).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Gracefully closes the Mongoose connection.
 * Use in test teardown or server shutdown hooks.
 */
export async function disconnectDB(): Promise<void> {
  if (!cached.conn) return;
  await mongoose.connection.close();
  cached.conn = null;
  cached.promise = null;
  console.info('[MongoDB] 🔌 Connection closed.');
}
