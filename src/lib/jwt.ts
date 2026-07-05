import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { UserRole } from '@/types';

// Use Jose (edge-compatible) instead of jsonwebtoken, which uses Node crypto
// Since we might use this in Next.js Middleware which runs on Edge runtime.

const JWT_ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets are not defined in environment variables.');
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface JwtRefreshPayload {
  userId: string;
}

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtError';
  }
}

// ─── Sign ────────────────────────────────────────────────────────────────────

export async function signAccessToken(payload: JwtAccessPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES || '15m')
    .sign(JWT_ACCESS_SECRET);
}

export async function signRefreshToken(payload: JwtRefreshPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES || '7d')
    .sign(JWT_REFRESH_SECRET);
}

// ─── Verify ──────────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<JwtAccessPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_ACCESS_SECRET);
    return payload as unknown as JwtAccessPayload;
  } catch (err) {
    throw new JwtError((err as Error).message || 'Invalid access token');
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as unknown as JwtRefreshPayload;
  } catch (err) {
    throw new JwtError((err as Error).message || 'Invalid refresh token');
  }
}

// ─── Decode (No Verify) ──────────────────────────────────────────────────────

export function decodeToken(token: string): unknown {
  try {
    return decodeJwt(token);
  } catch (err) {
    throw new JwtError('Failed to decode token');
  }
}
