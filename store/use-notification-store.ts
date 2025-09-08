import { create } from "zustand";
import type { Notification } from "@/lib/types/common";
import type { SubscriptionStatus } from "@/lib/types/notification";

interface NotificationState {
  notifications: Notification[];
  unread: boolean;
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;

  // 웹푸시 구독 상태
  status: SubscriptionStatus;
  isSubscribed: boolean;

  // useNotificationPermission 상태들
  hasAsked: boolean;
  permission: NotificationPermission | "unsupported";
  showSheet: boolean;
  isResubscribe: boolean;

  markAllRead: () => void;
  removeNotification: (id: string) => void;
  loadNotifications: (page?: number, pageSize?: number) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markNotificationsRead: (ids: string[]) => Promise<void>;

  // 웹푸시 관련 액션들
  updateSubscriptionStatus: (
    status: SubscriptionStatus,
    isSubscribed: boolean
  ) => void;
  setPermission: (permission: NotificationPermission | "unsupported") => void;

  // useNotificationPermission 액션들
  setNotificationState: (
    updates: Partial<{
      hasAsked: boolean;
      permission: NotificationPermission | "unsupported";
      showSheet: boolean;
      isResubscribe: boolean;
    }>
  ) => void;
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

  // 웹푸시 구독 상태 초기값
  status: "checking",
  isSubscribed: false,

  // useNotificationPermission 상태 초기값
  hasAsked: false,
  permission: "default",
  showSheet: false,
  isResubscribe: false,

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unread: false,
    })),
  removeNotification: async (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    set((state) => ({
      notifications: state.notifications.filter((n) => !ids.includes(n.id)),
    }));
  },
  loadNotifications: async (page = 1, pageSize = 20) => {
    set({
      page,
      pageSize,
    });
  },
  loadMoreNotifications: async () => {
    const { page, totalPages, pageSize } = get();
    if (page < totalPages) {
      const nextPage = page + 1;
      set({
        page: nextPage,
      });
    }
  },
  markNotificationsRead: async (ids) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, read: true } : n
      ),
      unread: state.notifications.some((n) => !ids.includes(n.id) && !n.read),
    }));
  },

  // 웹푸시 관련 액션
  updateSubscriptionStatus: (status, isSubscribed) =>
    set({ status, isSubscribed }),
  setPermission: (permission) => set({ permission }),

  // useNotificationPermission 액션들
  setNotificationState: (updates) => set((state) => ({ ...state, ...updates })),
}));

export { getNotificationId };
