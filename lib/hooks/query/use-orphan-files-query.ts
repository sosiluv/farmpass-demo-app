"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { settingsKeys } from "./query-keys";
import type { OrphanFilesStatus } from "@/lib/types/settings";

/**
 * Orphan 파일 상태 조회 Query Hook
 */
export function useOrphanFilesStatusQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return useAuthenticatedQuery(
    settingsKeys.cleanup.orphanFiles(),
    async (): Promise<OrphanFilesStatus> => {
      devLog.log("[QUERY] Orphan 파일 상태 조회 시작");

      const data = await apiClient("/api/admin/orphan-files/check", {
        method: "GET",
        context: "Orphan 파일 상태 조회",
      });

      devLog.log("[QUERY] Orphan 파일 상태 조회 완료:", data);
      return data;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5분간 fresh
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    }
  );
}
