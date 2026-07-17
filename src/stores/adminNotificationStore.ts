import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminNotification {
  id: string;
  type: 'user_registered' | 'critical_error';
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
  isRead: boolean;
}

interface AdminNotificationState {
  notifications: AdminNotification[];
  unreadCount: number;
}

interface AdminNotificationActions {
  addNotification: (notification: Omit<AdminNotification, 'id' | 'isRead'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

type AdminNotificationStore = AdminNotificationState & AdminNotificationActions;

export const useAdminNotificationStore = create<AdminNotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => {
          const newNotif: AdminNotification = {
            ...notification,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            isRead: false,
          };
          const updated = [newNotif, ...state.notifications].slice(0, 100); // keep max 100
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        }),

      markRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'admin-notifications-storage', // key for localStorage
    }
  )
);
