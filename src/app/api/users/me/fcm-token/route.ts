export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { ApiResponse } from '@/types';

// ─── POST /api/users/me/fcm-token ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    const body = await req.json() as { token?: string };

    if (!body.token || typeof body.token !== 'string' || body.token.trim() === '') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'A valid FCM token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    await User.findByIdAndUpdate(
      auth.user.userId,
      { fcmToken: body.token.trim() },
      { new: true }
    );

    return NextResponse.json<ApiResponse>({ success: true, message: 'FCM token saved' });
  } catch (error) {
    console.error('[FCM Token API] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to save FCM token' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/users/me/fcm-token ──────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();
    await User.findByIdAndUpdate(auth.user.userId, { $unset: { fcmToken: '' } });
    return NextResponse.json<ApiResponse>({ success: true, message: 'FCM token removed' });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to remove FCM token' }, { status: 500 });
  }
}
