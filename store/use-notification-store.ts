import { create } from "zustand";
import type { Notification } from "@/lib/types/notification";

interface NotificationState {
  notifications: Notification[];
  unread: boolean;
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  loadNotifications: (page?: number, pageSize?: number) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markNotificationsRead: (ids: string[]) => Promise<void>;
}

function getNotificationId(n: Notification) {
  return `${n.created_at}_${n.title}_${n.message}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unread: false,
  page: 1,
  total: 0,
  totalPages: 1,
  pageSize: 20,
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unread: false,
    })),
  removeNotification: async (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    // React Query mutation을 사용하므로 여기서는 상태만 업데이트
    set((state) => ({
      notifications: state.notifications.filter((n) => !ids.includes(n.id)),
    }));
  },
  loadNotifications: async (page = 1, pageSize = 20) => {
    // React Query를 사용하므로 여기서는 상태만 업데이트
    // 실제 데이터는 useNotificationsQuery에서 관리
    set({
      page,
      pageSize,
    });
  },
  loadMoreNotifications: async () => {
    const { page, totalPages, pageSize } = get();
    if (page < totalPages) {
      const nextPage = page + 1;
      // React Query를 사용하므로 여기서는 상태만 업데이트
      set({
        page: nextPage,
      });
    }
  },
  markNotificationsRead: async (ids) => {
    // React Query mutation을 사용하므로 여기서는 상태만 업데이트
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, read: true } : n
      ),
      unread: state.notifications.some((n) => !ids.includes(n.id) && !n.read),
    }));
  },
}));

export { getNotificationId };
