import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { Report, Ticket, Upvote } from '@/models';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters').optional(),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  ward:  z.string().max(100).optional().or(z.literal('')),
});

// ─── GET /api/users/me ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findById(auth.user.userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Attach report stats
    const [totalReports, resolvedReports, upvotesGiven] = await Promise.all([
      Report.countDocuments({ reporterId: user._id, isDeleted: false }),
      Report.countDocuments({ reporterId: user._id, isDeleted: false, status: 'resolved' }),
      Upvote.countDocuments({ userId: user._id }),
    ]);

    // Safe user — strip sensitive fields
    const { password, refreshTokenHash, fcmToken, ...safeUser } = user as any;

    return NextResponse.json({
      success: true,
      data: {
        ...safeUser,
        id: user._id.toString(),
        stats: { totalReports, resolvedReports, upvotesGiven },
      },
    });
  } catch (error: any) {
    console.error('[GET /api/users/me]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (parsed.data.name  !== undefined) updateData.name  = parsed.data.name;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || undefined;
    if (parsed.data.ward  !== undefined) updateData.ward  = parsed.data.ward  || undefined;

    const updated = await User.findByIdAndUpdate(
      auth.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { password, refreshTokenHash, fcmToken, ...safeUser } = updated as any;

    return NextResponse.json({ success: true, data: { ...safeUser, id: updated._id.toString() } });
  } catch (error: any) {
    console.error('[PUT /api/users/me]', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
