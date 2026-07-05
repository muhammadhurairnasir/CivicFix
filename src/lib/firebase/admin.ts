import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

// ─── Singleton Init ───────────────────────────────────────────────────────────

function getAdminApp(): App | null {
  if (!process.env.FIREBASE_ADMIN_JSON) {
    return null;
  }

  if (getApps().length > 0) {
    return getApp();
  }

  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_ADMIN_JSON, 'base64').toString('utf-8')
    );

    return initializeApp({ credential: cert(serviceAccount) });
  } catch (err) {
    console.error('[Firebase Admin] Failed to initialize:', err);
    return null;
  }
}

export function getAdminMessaging(): Messaging | null {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

// ─── Send to Single Token ─────────────────────────────────────────────────────

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messaging = getAdminMessaging();
  if (!messaging) return;

  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        },
        fcmOptions: {
          link: data?.reportId
            ? `/reports/${data.reportId}`
            : '/dashboard/notifications',
        },
      },
    });
  } catch (err: any) {
    const invalidTokenCodes = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
    ];
    if (invalidTokenCodes.includes(err?.errorInfo?.code)) {
      try {
        await connectDB();
        await User.updateOne({ fcmToken }, { $unset: { fcmToken: '' } });
        console.log('[Firebase] Removed stale FCM token');
      } catch (dbErr) {
        console.error('[Firebase] Failed to remove stale token:', dbErr);
      }
    } else {
      console.error('[Firebase] sendPushNotification error:', err?.errorInfo || err);
    }
  }
}

// ─── Send to Multiple Tokens ──────────────────────────────────────────────────

export async function sendPushToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messaging = getAdminMessaging();
  if (!messaging || tokens.length === 0) return;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        },
        fcmOptions: {
          link: data?.reportId
            ? `/reports/${data.reportId}`
            : '/dashboard/notifications',
        },
      },
    });

    // Clean up invalid tokens
    const staleTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = (res.error as any)?.errorInfo?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    if (staleTokens.length > 0) {
      await connectDB();
      await User.updateMany(
        { fcmToken: { $in: staleTokens } },
        { $unset: { fcmToken: '' } }
      );
    }
  } catch (err) {
    console.error('[Firebase] sendPushToMultiple error:', err);
  }
}

// ─── Send to Topic ────────────────────────────────────────────────────────────

export async function sendPushToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const messaging = getAdminMessaging();
  if (!messaging) return;

  try {
    await messaging.send({
      topic,
      notification: { title, body },
      data: data || {},
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
        },
      },
    });
  } catch (err) {
    console.error('[Firebase] sendPushToTopic error:', err);
  }
}
