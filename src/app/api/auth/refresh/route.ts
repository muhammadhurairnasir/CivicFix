export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';
import { hashToken } from '@/lib/auth';
import { getRefreshToken, setRefreshToken } from '@/lib/redis';
import { ApiResponse } from '@/types';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('__civicfix_rt')?.value;

    if (!refreshToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token validity
    const payload = await verifyRefreshToken(refreshToken);
    
    // Check Redis for token hash
    const storedHash = await getRefreshToken(payload.userId);
    const incomingHash = hashToken(refreshToken);

    if (!storedHash || storedHash !== incomingHash) {
      // Clear cookie if invalid/compromised
      cookies().delete('__civicfix_rt');
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      cookies().delete('__civicfix_rt');
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User inactive or not found' },
        { status: 401 }
      );
    }

    // Sign new tokens (Rotation)
    const newAccessToken = await signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const newRefreshToken = await signRefreshToken({ userId: user.id });
    
    // Store new hash in Redis
    const newHashedRT = hashToken(newRefreshToken);
    await setRefreshToken(user.id, newHashedRT, 7 * 24 * 60 * 60);

    // Update cookie
    cookies().set({
      name: '__civicfix_rt',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // Set new access token cookie
    cookies().set({
      name: '__civicfix_at',
      value: newAccessToken,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        message: 'Token refreshed',
        data: { accessToken: newAccessToken }
      },
      { status: 200 }
    );
  } catch (error) {
    cookies().delete('__civicfix_rt');
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
  }
}
