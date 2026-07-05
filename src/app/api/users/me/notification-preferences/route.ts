import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const DEFAULT_PREFS = {
  email: { statusUpdates: true, comments: true, slaAlerts: true },
  push:  { statusUpdates: true, comments: false, slaAlerts: true },
};

const prefsSchema = z.object({
  email: z.object({
    statusUpdates: z.boolean(),
    comments:      z.boolean(),
    slaAlerts:     z.boolean(),
  }).optional(),
  push: z.object({
    statusUpdates: z.boolean(),
    comments:      z.boolean(),
    slaAlerts:     z.boolean(),
  }).optional(),
});

// ─── GET /api/users/me/notification-preferences ───────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(auth.user.userId).select('notificationPreferences').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const prefs = (user as any).notificationPreferences ?? DEFAULT_PREFS;

    // Merge with defaults to ensure all keys exist for new users
    return NextResponse.json({
      success: true,
      data: {
        email: { ...DEFAULT_PREFS.email, ...(prefs.email ?? {}) },
        push:  { ...DEFAULT_PREFS.push,  ...(prefs.push  ?? {}) },
      },
    });
  } catch (error: any) {
    console.error('[GET /api/users/me/notification-preferences]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// ─── PUT /api/users/me/notification-preferences ───────────────────────────────
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const parsed = prefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid preferences data' }, { status: 400 });
    }

    // Build partial update — only update the keys provided
    const $set: Record<string, any> = {};
    if (parsed.data.email) {
      const { statusUpdates, comments, slaAlerts } = parsed.data.email;
      if (statusUpdates !== undefined) $set['notificationPreferences.email.statusUpdates'] = statusUpdates;
      if (comments      !== undefined) $set['notificationPreferences.email.comments']      = comments;
      if (slaAlerts     !== undefined) $set['notificationPreferences.email.slaAlerts']     = slaAlerts;
    }
    if (parsed.data.push) {
      const { statusUpdates, comments, slaAlerts } = parsed.data.push;
      if (statusUpdates !== undefined) $set['notificationPreferences.push.statusUpdates'] = statusUpdates;
      if (comments      !== undefined) $set['notificationPreferences.push.comments']      = comments;
      if (slaAlerts     !== undefined) $set['notificationPreferences.push.slaAlerts']     = slaAlerts;
    }

    const updated = await User.findByIdAndUpdate(
      auth.user.userId,
      { $set },
      { new: true }
    ).select('notificationPreferences').lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const prefs = (updated as any).notificationPreferences ?? DEFAULT_PREFS;

    return NextResponse.json({
      success: true,
      data: {
        email: { ...DEFAULT_PREFS.email, ...(prefs.email ?? {}) },
        push:  { ...DEFAULT_PREFS.push,  ...(prefs.push  ?? {}) },
      },
    });
  } catch (error: any) {
    console.error('[PUT /api/users/me/notification-preferences]', error);
    return NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
  }
}
