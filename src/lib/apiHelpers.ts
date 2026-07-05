import { NextResponse } from 'next/server';

/**
 * Checks if an error is a "DB not configured" sentinel thrown by connectDB()
 * when MONGODB_URI is missing or still a placeholder in dev.
 */
export function isDbNotConfigured(err: unknown): boolean {
  return err instanceof Error && err.message === 'DB_NOT_CONFIGURED';
}

/**
 * Returns a 503 JSON response indicating the database is not yet configured.
 * Used in API route catch blocks so dev environments don't see 500 errors
 * when MONGODB_URI hasn't been set up yet.
 */
export function dbNotConfiguredResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Database not configured. Add a valid MONGODB_URI to .env.local.',
    },
    { status: 503 }
  );
}

/**
 * Wraps an API handler error — returns 503 for missing DB config, 500 otherwise.
 */
export function handleApiError(error: unknown, label: string) {
  if (isDbNotConfigured(error)) {
    console.warn(`[${label}] DB_NOT_CONFIGURED — skipping (dev mode)`);
    return dbNotConfiguredResponse();
  }
  console.error(`[${label}] Unhandled error:`, error);
  return NextResponse.json(
    { success: false, error: 'Internal Server Error' },
    { status: 500 }
  );
}
