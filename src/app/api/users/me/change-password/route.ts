import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireAuth } from '@/lib/auth';
import { deleteRefreshToken } from '@/lib/redis';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch user WITH password field (it's selected: false by default)
    const user = await User.findById(auth.user.userId).select('+password');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    // Prevent reuse of same password
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return NextResponse.json({ success: false, error: 'New password must be different from current password' }, { status: 400 });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Force re-login everywhere by removing refresh token from Redis
    await deleteRefreshToken(auth.user.userId);

    return NextResponse.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (error: any) {
    console.error('[POST /api/users/me/change-password]', error);
    return NextResponse.json({ success: false, error: 'Failed to change password' }, { status: 500 });
  }
}
