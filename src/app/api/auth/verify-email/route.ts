export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { getEmailVerifyToken, deleteEmailVerifyToken } from '@/lib/redis';
import { sendWelcomeEmail } from '@/lib/email';
import { ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing token or email' },
        { status: 400 }
      );
    }

    const storedToken = await getEmailVerifyToken(email);

    if (!storedToken || storedToken !== token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json<ApiResponse>(
        { success: true, message: 'Email is already verified' },
        { status: 200 }
      );
    }

    user.isVerified = true;
    await user.save();

    await deleteEmailVerifyToken(email);
    
    // Fire and forget welcome email
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Verify Email API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
