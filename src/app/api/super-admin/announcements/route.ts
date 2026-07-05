import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Notification } from '@/models';
import { requireRole } from '@/lib/auth';
import { NotificationType, UserRole } from '@/types';
import { getIO } from '@/lib/socket/server';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { sendPushToMultiple } from '@/lib/firebase/admin';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(10),
  targetRole: z.enum(['all', UserRole.CITIZEN, UserRole.CREW, UserRole.ADMIN]),
  priority: z.enum(['info', 'warning', 'critical'])
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    const bodyObj = await req.json();
    const parsedData = postSchema.safeParse(bodyObj);

    if (!parsedData.success) {
      return NextResponse.json({ success: false, error: 'Invalid data', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { title, body, targetRole, priority } = parsedData.data;

    // Determine query
    const userQuery: any = { isActive: true };
    if (targetRole !== 'all') {
      if (targetRole === UserRole.ADMIN) {
        userQuery.role = { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] };
      } else {
        userQuery.role = targetRole;
      }
    }

    // Get affected users (we need _id for DB and fcmToken for push)
    const affectedUsers = await User.find(userQuery).select('_id fcmToken').lean();
    
    if (affectedUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No users matched criteria', sent: 0 });
    }

    // 1. Create Notifications in DB in bulk
    const now = new Date();
    const notificationsToInsert = affectedUsers.map((u: any) => ({
      userId: u._id,
      type: NotificationType.SYSTEM,
      title: priority === 'critical' ? `🚨 ${title}` : title,
      body,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    }));

    await Notification.insertMany(notificationsToInsert, { ordered: false });

    // 2. Emit Socket events
    try {
      const io = getIO();
      const eventPayload = {
        _id: 'system-' + Date.now(),
        type: NotificationType.SYSTEM,
        title: priority === 'critical' ? `🚨 ${title}` : title,
        body,
        isRead: false,
        createdAt: now.toISOString(),
      };

      if (targetRole === 'all') {
        io.to('authenticated').emit(SOCKET_EVENTS.NOTIFICATION_NEW, eventPayload);
      } else if (targetRole === UserRole.ADMIN) {
        io.to('role:admin').emit(SOCKET_EVENTS.NOTIFICATION_NEW, eventPayload);
      } else if (targetRole === UserRole.CREW) {
        io.to('role:crew').emit(SOCKET_EVENTS.NOTIFICATION_NEW, eventPayload);
      } else {
        affectedUsers.forEach((u: any) => {
          io.to(`user:${u._id}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, eventPayload);
        });
      }
    } catch (socketErr) {
      console.warn('[Announcements] Socket emit failed', socketErr);
    }

    // 3. Send Push Notifications if critical
    let pushesSent = 0;
    if (priority === 'critical') {
      const tokens = affectedUsers
        .filter((u: any) => !!u.fcmToken)
        .map((u: any) => u.fcmToken);

      if (tokens.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < tokens.length; i += chunkSize) {
          const chunk = tokens.slice(i, i + chunkSize);
          await sendPushToMultiple(chunk, `🚨 ${title}`, body, { type: NotificationType.SYSTEM })
            .catch(err => console.error('[Announcements] Push batch failed', err));
          pushesSent += chunk.length;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: affectedUsers.length,
      pushesSent 
    });

  } catch (error: any) {
    console.error('[SuperAdmin Announcements Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to send announcement' }, { status: 500 });
  }
}

// Get Announcement History
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    const notifications = await Notification.find({ type: NotificationType.SYSTEM })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    const uniqueMap = new Map();
    notifications.forEach((n: any) => {
      const key = `${n.title}-${n.body}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          _id: n._id.toString(),
          title: n.title,
          body: n.body,
          createdAt: n.createdAt
        });
      }
    });

    return NextResponse.json({ success: true, data: Array.from(uniqueMap.values()).slice(0, 20) });
  } catch (error: any) {
    console.error('[SuperAdmin Announcements GET Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
  }
}
