import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { JwtAccessPayload, verifyAccessToken } from './jwt';
import { UserRole } from '@/types';

// ─── Token Utilities ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random hex string.
 * Ideal for email verification or password reset tokens.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash a token for secure storage.
 * Never store raw tokens in the DB/Redis.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Session Retrieval ───────────────────────────────────────────────────────

/**
 * Reads the access token from the Authorization header or cookie.
 * Designed for use within Server Components or API Routes.
 */
export async function getServerSession(): Promise<JwtAccessPayload | null> {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    let token = '';
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Fallback to cookie if present
      const cookieHeader = headersList.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map((c) => {
            const [k, ...v] = c.split('=');
            return [k, v.join('=')];
          })
        );
        token = cookies['__civicfix_at'] || '';
      }
    }

    if (!token) return null;

    return await verifyAccessToken(token);
  } catch (err) {
    return null;
  }
}

// ─── Route Middleware Helpers ────────────────────────────────────────────────

type AuthResult = {
  user: JwtAccessPayload | null;
  error: string | null;
};

/**
 * Helper to validate an access token directly from a NextRequest object.
 * Returns the payload or an error message.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = req.cookies.get('__civicfix_at')?.value || '';
  }

  if (!token) {
    return { user: null, error: 'Unauthorized: Missing token' };
  }

  try {
    const payload = await verifyAccessToken(token);
    return { user: payload, error: null };
  } catch (err) {
    return { user: null, error: (err as Error).message };
  }
}

/**
 * Extends requireAuth to also validate that the user's role is in the allowed array.
 */
export async function requireRole(req: NextRequest, allowedRoles: UserRole[]): Promise<AuthResult> {
  const result = await requireAuth(req);
  
  if (result.error || !result.user) {
    return result;
  }

  if (!allowedRoles.includes(result.user.role)) {
    return { user: result.user, error: 'Forbidden: Insufficient permissions' };
  }

  return result;
}
