"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { settingsKeys } from "./query-keys";
import type { NotificationSettings } from "@/lib/types/notification";

/**
 * React Query 기반 Notification Settings Hook
 * 사용자별 알림 설정을 조회합니다.
 */
export function useNotificationSettingsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return useAuthenticatedQuery(
    settingsKeys.notifications(),
    async () => {
      const response = await apiClient("/api/notifications/settings", {
        method: "GET",
        context: "알림 설정 조회",
      });

      return response as NotificationSettings;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
    }
  );
}

/**
 * Legacy Hook과의 호환성을 위한 Wrapper
 * 기존 코드와 동일한 인터페이스를 제공합니다.
 */
export function useNotificationSettingsQueryCompat() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useNotificationSettingsQuery();

  return {
    data,
    loading,
    error,
    refetch: async () => {
      const result = await refetch();
      return result.data;
    },
  };
}
