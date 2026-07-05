export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, error } = await requireAuth(req);

    if (error || !authUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(authUser.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Account has been deactivated' },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { 
        success: true, 
        data: { user: user.toSafeObject() }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Me API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
