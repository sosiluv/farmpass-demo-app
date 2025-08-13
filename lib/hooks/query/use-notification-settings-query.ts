"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data/api-client";
import { settingsKeys } from "./query-keys";
import type { UserNotificationSetting } from "@/lib/types/common";

/**
 * React Query 기반 Notification Settings Hook
 * 사용자별 알림 설정을 조회합니다.
 */
export function useNotificationSettingsQuery(options?: { enabled?: boolean }) {
  return useAuthenticatedQuery(
    settingsKeys.notifications(),
    async (): Promise<UserNotificationSetting> => {
      const response = await apiClient("/api/notifications/settings", {
        method: "GET",
        context: "알림 설정 조회",
      });

      return response;
    },
    {
      enabled: options?.enabled !== false,
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
    }
  );
}
