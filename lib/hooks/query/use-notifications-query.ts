"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { notificationKeys } from "./query-keys";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";
import type {
  Notification,
  NotificationsResponse,
  NotificationsFilters,
} from "@/lib/types/notification";

/**
 * React Query 기반 알림 목록 조회 Hook
 */
export function useNotificationsQuery(filters: NotificationsFilters = {}) {
  const { state } = useAuth();

  const { page = 1, pageSize = 20, read, type } = filters;

  // 현재 사용자 ID
  const currentUserId =
    state.status === "authenticated" ? state.user.id : undefined;

  // 알림 목록 쿼리 (사용자별로 캐시 분리)
  const notificationsQuery = useAuthenticatedQuery(
    [...notificationKeys.list({ page, pageSize, read, type }), currentUserId],
    async (): Promise<NotificationsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (read !== undefined) {
        params.append("read", read.toString());
      }

      if (type) {
        params.append("type", type);
      }

      const response = await apiClient(
        `/api/notifications?${params.toString()}`,
        {
          method: "GET",
          context: "알림 목록 조회",
        }
      );

      return response;
    },
    {
      enabled: state.status === "authenticated" && !!currentUserId,
      staleTime: 2 * 60 * 1000, // 2분 캐싱 (알림은 자주 변경됨)
      gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  // 🔥 알림 실시간 업데이트 구독
  useSupabaseRealtime({
    table: "notifications",
    refetch: notificationsQuery.refetch,
  });

  return {
    // 데이터
    notifications: (notificationsQuery.data?.notifications ||
      []) as Notification[],
    total: notificationsQuery.data?.total || 0,
    page: notificationsQuery.data?.page || 1,
    totalPages: notificationsQuery.data?.totalPages || 1,
    pageSize: notificationsQuery.data?.pageSize || 20,

    // 상태
    loading: notificationsQuery.isLoading,
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,

    // 액션
    refetch: notificationsQuery.refetch,
  };
}
