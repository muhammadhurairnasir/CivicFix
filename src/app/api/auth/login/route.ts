export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { rateLimit } from '@/lib/rateLimit';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { hashToken } from '@/lib/auth';
import { setRefreshToken } from '@/lib/redis';
import { ApiResponse } from '@/types';
import { ZodError } from 'zod';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/apiHelpers';

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
    // Stricter rate limit for login attempts to prevent brute force (5 per 15min)
    const rateLimitRes = await rateLimit(req, `login:${ip}`, 5, 15 * 60);
    
    if (!rateLimitRes.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    await connectDB();

    const user = await User.findByEmail(validatedData.email);
    
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Please verify your email address before logging in.' },
        { status: 403 }
      );
    }

    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Success - Generate tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await signRefreshToken({ userId: user.id });
    
    // Store hashed refresh token in Redis (7 days TTL)
    const hashedRT = hashToken(refreshToken);
    await setRefreshToken(user.id, hashedRT, 7 * 24 * 60 * 60);

    user.lastLogin = new Date();
    await user.save();

    // Set refresh token cookie
    cookies().set({
      name: '__civicfix_rt',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Set access token cookie (required for middleware page protection)
    cookies().set({
      name: '__civicfix_at',
      value: accessToken,
      httpOnly: false, // Let client read it if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 mins (match JWT expiration)
      path: '/',
    });

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        message: 'Login successful',
        data: { user: user.toSafeObject(), accessToken }
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation failed', errors: error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }
    return handleApiError(error, 'Login API');
  }
}
