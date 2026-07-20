import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores';
import { useAdminNotificationStore } from '../stores/adminNotificationStore';
import { API_BASE_URL } from '../services/apiRoutes';
import toast from 'react-hot-toast';

const ADMIN_EVENTS = {
  USER_REGISTERED: 'admin.user.registered',
  CRITICAL_ERROR: 'admin.critical.error',
} as const;

export function useAdminSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated, user } = useAuthStore();
  const addNotification = useAdminNotificationStore((s) => s.addNotification);

  useEffect(() => {
    // Only connect if authenticated and user is super_admin
    if (!isAuthenticated || !user || user.role !== 'super_admin') {
      return;
    }

    // Build socket URL from API base URL
    const socketUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

    const socket = io(`${socketUrl}/realtime`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AdminSocket] Connected to realtime namespace');
    });

    socket.on('disconnect', (reason) => {
      console.log('[AdminSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[AdminSocket] Connection error:', err.message);
    });

    // Listen for admin events
    socket.on(ADMIN_EVENTS.USER_REGISTERED, (payload: { type: string; data: { userId: string; email: string; fullName?: string; createdAt: string }; occurredAt: string }) => {
      const { data } = payload;
      addNotification({
        type: 'user_registered',
        title: 'Người dùng mới đăng ký',
        message: `${data.fullName || data.email} vừa đăng ký tài khoản`,
        data: data as unknown as Record<string, unknown>,
        timestamp: payload.occurredAt || new Date().toISOString(),
      });

      toast.success(`Người dùng mới: ${data.fullName || data.email}`, {
        duration: 3000,
      });
    });

    socket.on(ADMIN_EVENTS.CRITICAL_ERROR, (payload: { type: string; data: { message: string; source: string; severity: string; details?: string; occurredAt: string }; occurredAt: string }) => {
      const { data } = payload;
      addNotification({
        type: 'critical_error',
        title: 'Lỗi nghiêm trọng',
        message: `[${data.source}] ${data.message}`,
        data: data as unknown as Record<string, unknown>,
        timestamp: payload.occurredAt || new Date().toISOString(),
      });

      toast.error(`Lỗi nghiêm trọng: ${data.message}`, {
        icon: '🚨',
        duration: 8000,
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, addNotification]);

  return socketRef;
}
