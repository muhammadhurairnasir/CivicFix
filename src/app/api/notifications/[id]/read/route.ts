export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import { ApiResponse } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, userId: auth.user.userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: notification });

  } catch (error) {
    return handleApiError(error, 'PATCH Notification Read API');
  }
}
