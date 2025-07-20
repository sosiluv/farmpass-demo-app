"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { cleanupKeys } from "./query-keys";
import type { CleanupStatus } from "@/lib/types/settings";

/**
 * 정리 상태 조회 Query Hook
 */
export function useCleanupStatusQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return useAuthenticatedQuery(
    cleanupKeys.status(),
    async (): Promise<CleanupStatus> => {
      devLog.log("[QUERY] 정리 상태 조회 시작");

      const data = await apiClient("/api/admin/logs/cleanup", {
        method: "GET",
        context: "정리 상태 조회",
      });

      devLog.log("[QUERY] 정리 상태 조회 완료:", data);
      return data;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 2, // 2분간 fresh
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    }
  );
}
