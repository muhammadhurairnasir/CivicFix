import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireAuth } from '@/lib/auth';
import { deleteRefreshToken } from '@/lib/redis';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const deactivateSchema = z.object({
  password: z.string().min(1, 'Password is required to deactivate your account'),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const parsed = deactivateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    // Fetch user WITH password
    const user = await User.findById(auth.user.userId).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isMatch = await user.comparePassword(parsed.data.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Incorrect password. Account not deactivated.' }, { status: 400 });
    }

    // Deactivate
    user.isActive = false;
    await user.save();

    // Invalidate all sessions
    await deleteRefreshToken(auth.user.userId);

    return NextResponse.json({ success: true, message: 'Account deactivated successfully.' });
  } catch (error: any) {
    console.error('[POST /api/users/me/deactivate]', error);
    return NextResponse.json({ success: false, error: 'Failed to deactivate account' }, { status: 500 });
  }
}
