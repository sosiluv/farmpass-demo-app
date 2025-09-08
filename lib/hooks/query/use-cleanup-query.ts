"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data";
import { settingsKeys } from "./query-keys";
import type { CleanupStatus } from "@/lib/types/settings";

/**
 * 정리 상태 조회 Query Hook
 */
export function useCleanupStatusQuery() {
  const { user } = useAuth();

  return useAuthenticatedQuery(
    settingsKeys.cleanup.status(),
    async (): Promise<CleanupStatus> => {
      const data = await apiClient("/api/admin/logs/cleanup", {
        method: "GET",
        context: "정리 상태 조회",
      });

      return data;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 2, // 2분간 fresh
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    }
  );
}
