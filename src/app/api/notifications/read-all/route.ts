export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import { ApiResponse } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const result = await Notification.updateMany(
      { userId: auth.user.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json<ApiResponse>({ 
      success: true, 
      message: `${result.modifiedCount} notifications marked as read.` 
    });

  } catch (error) {
    return handleApiError(error, 'PATCH Notification Read All API');
  }
}
