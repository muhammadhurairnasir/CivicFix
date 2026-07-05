export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { getPasswordResetToken, deletePasswordResetToken, deleteRefreshToken } from '@/lib/redis';
import { ApiResponse } from '@/types';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = resetPasswordSchema.parse(body);

    const storedToken = await getPasswordResetToken(email);

    if (!storedToken || storedToken !== validatedData.token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findByEmail(email);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = validatedData.password;
    await user.save();

    // Invalidate reset token
    await deletePasswordResetToken(email);

    // Force re-login everywhere by deleting refresh token from Redis
    await deleteRefreshToken(user.id);

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Password has been reset successfully. You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation failed', errors: error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    console.error('[Reset Password API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
