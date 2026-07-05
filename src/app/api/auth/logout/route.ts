export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteRefreshToken } from '@/lib/redis';
import { ApiResponse } from '@/types';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(req);

    if (error || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Invalidate refresh token in Redis
    await deleteRefreshToken(user.userId);

    // Clear HTTP-only cookie
    cookies().delete('__civicfix_rt');
    // Also try clearing access token cookie if we were storing it
    cookies().delete('__civicfix_at');

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Logout API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
