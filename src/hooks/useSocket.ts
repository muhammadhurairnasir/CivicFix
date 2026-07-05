'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

let socketInstance: Socket | null = null;

export function useSocket() {
  const { isAuthenticated } = useAuth();
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('__civicfix_at') : null;
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        setIsConnected(false);
        setSocket(null);
      }
      return;
    }

    if (!socketInstance) {
      socketInstance = io({
        path: '/api/socket',
        auth: {
          token: accessToken,
        },
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket authentication/connection failed:', err.message);
      });
      
      setSocket(socketInstance);
    } else if (socketInstance.auth && (socketInstance.auth as any).token !== accessToken) {
      // If token changed, update it and reconnect
      socketInstance.auth = { token: accessToken };
      socketInstance.disconnect().connect();
    }

    // Cleanup not done here to persist socket across hooks, but handled globally via token change
  }, [accessToken]);

  const joinReport = useCallback((reportId: string) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('join:report', reportId);
    } else if (socketInstance) {
      // Retry once connected
      socketInstance.once('connect', () => {
        socketInstance?.emit('join:report', reportId);
      });
    }
  }, []);

  const leaveReport = useCallback((reportId: string) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('leave:report', reportId);
    }
  }, []);

  const onEvent = useCallback((event: string, handler: (data: any) => void) => {
    if (!socketInstance) return () => {};
    socketInstance.on(event, handler);
    return () => {
      socketInstance?.off(event, handler);
    };
  }, []);

  return { socket, isConnected, joinReport, leaveReport, onEvent };
}
