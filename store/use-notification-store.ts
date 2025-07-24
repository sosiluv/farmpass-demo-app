import { create } from "zustand";

export type Notification = {
  title: string;
  message: string;
  timestamp?: number;
  read?: boolean;
  [key: string]: any;
};

interface NotificationState {
  notifications: Notification[];
  unread: boolean;
  addNotification: (n: Notification) => void;
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
}

function getNotificationId(n: Notification) {
  return `${n.timestamp ?? 0}_${n.title}_${n.message}`;
}

export const useNotificationStore = create<
  NotificationState & { clearAll: () => void }
>((set) => ({
  notifications: [],
  unread: false,
  addNotification: (n) =>
    set((state) => ({
      notifications: [{ ...n, read: false }, ...state.notifications].slice(
        0,
        10
      ),
      unread: true,
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unread: false,
    })),
  markNotificationRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        getNotificationId(n) === id ? { ...n, read: true } : n
      );
      const unread = notifications.some((n) => !n.read);
      return { notifications, unread };
    }),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (n) => getNotificationId(n) !== id
      ),
    })),
  clearAll: () => set({ notifications: [], unread: false }),
}));

export { getNotificationId };
