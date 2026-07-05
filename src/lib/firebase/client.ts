import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging as getFirebaseMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// ─── Singleton Init ───────────────────────────────────────────────────────────

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;

  const configStr = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!configStr) return null;

  try {
    const config = JSON.parse(configStr);
    if (getApps().length > 0) return getApp();
    return initializeApp(config);
  } catch (err) {
    console.error('[Firebase Client] Failed to initialize:', err);
    return null;
  }
}

export function getMessagingInstance(): Messaging | null {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    return getFirebaseMessaging(app);
  } catch (err) {
    // Messaging not supported (e.g. Safari without push support)
    return null;
  }
}

// ─── Request Permission & Get Token ──────────────────────────────────────────

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null; // SSR or iOS Safari
  }

  const messaging = getMessagingInstance();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[Firebase Client] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    return token || null;
  } catch (err) {
    // Permission denied or browser not supported — silent fallback
    console.warn('[Firebase Client] requestNotificationPermission failed:', err);
    return null;
  }
}

// ─── Foreground Message Listener ─────────────────────────────────────────────

export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    callback({
      notification: payload.notification as any,
      data: payload.data as Record<string, string> | undefined,
    });
  });

  return unsubscribe;
}
