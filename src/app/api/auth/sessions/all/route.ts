import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteRefreshToken } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteRefreshToken(auth.user.userId);
    return NextResponse.json({ success: true, message: 'Signed out of all devices' });
  } catch (error: any) {
    console.error('[DELETE /api/auth/sessions/all]', error);
    return NextResponse.json({ success: false, error: 'Failed to sign out' }, { status: 500 });
  }
}
