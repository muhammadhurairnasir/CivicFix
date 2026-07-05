export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { rateLimit } from '@/lib/rateLimit';
import { generateSecureToken } from '@/lib/auth';
import { setPasswordResetToken } from '@/lib/redis';
import { sendPasswordResetEmail } from '@/lib/email';
import { ApiResponse } from '@/types';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
    // Max 3 forgot password requests per email/IP per hour
    const rateLimitRes = await rateLimit(req, `forgotpwd:${validatedData.email}:${ip}`, 3, 60 * 60);
    
    if (!rateLimitRes.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: validatedData.email });

    // We DO NOT reveal whether the email exists for security reasons.
    // Always return the same success message.
    if (user && user.isActive) {
      const resetToken = generateSecureToken();
      await setPasswordResetToken(user.email, resetToken, 3600); // 1 hour
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    }

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        message: 'If an account exists with that email, a password reset link has been sent.' 
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

    console.error('[Forgot Password API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
