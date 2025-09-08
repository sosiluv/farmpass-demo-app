"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data";
import { settingsKeys } from "./query-keys";
import type { OrphanFilesStatus } from "@/lib/types/settings";

/**
 * Orphan 파일 상태 조회 Query Hook
 */
export function useOrphanFilesStatusQuery() {
  const { user } = useAuth();

  return useAuthenticatedQuery(
    settingsKeys.cleanup.orphanFiles(),
    async (): Promise<OrphanFilesStatus> => {
      const data = await apiClient("/api/admin/orphan-files/check", {
        method: "GET",
        context: "Orphan 파일 상태 조회",
      });

      return data;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5분간 fresh
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    }
  );
}
