'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useToast } from './useToast';

export function useRealtimeNotifications() {
  const { onEvent, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!isConnected) return;

    const cleanup = onEvent(SOCKET_EVENTS.NOTIFICATION_NEW, (newNotification: any) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      if (toast) {
        toast({
          title: newNotification.title,
          description: newNotification.body,
          variant: 'default',
        });
      }
    });

    return cleanup;
  }, [isConnected, onEvent, toast]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
