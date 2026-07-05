'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/client';
import { useToast } from '@/hooks/useToast';

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const savedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // iOS Safari check — no push support
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) return;

    let unsubscribeForeground: (() => void) | null = null;

    const init = async () => {
      try {
        const token = await requestNotificationPermission();

        if (token && token !== savedTokenRef.current) {
          savedTokenRef.current = token;
          // Save token to server
          await fetch('/api/users/me/fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        }

        // Listen for foreground messages
        unsubscribeForeground = onForegroundMessage((payload) => {
          const { notification, data } = payload;
          if (!notification) return;

          toast({
            title: notification.title || 'CivicFix',
            description: notification.body,
            variant: 'default',
          });
        });
      } catch (err) {
        // Silent fallback — push is optional
        console.warn('[usePushNotifications] Non-critical error:', err);
      }
    };

    init();

    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, [isAuthenticated, toast]);
}
