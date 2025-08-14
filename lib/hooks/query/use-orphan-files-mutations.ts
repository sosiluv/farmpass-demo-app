"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { settingsKeys, adminKeys } from "./query-keys";
import type { CleanupResult } from "@/lib/types/system";

/**
 * Orphan 파일 정리 Mutation Hook
 */
export function useCleanupOrphanFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CleanupResult> => {
      const result = await apiClient("/api/admin/orphan-files/cleanup", {
        method: "POST",
        context: "Orphan 파일 정리",
      });

      return result;
    },
    onSuccess: (result) => {
      // Orphan 파일 상태 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: settingsKeys.cleanup.orphanFiles(),
      });

      // 시스템 로그 무효화 (정리 작업 로그 생성)
      queryClient.invalidateQueries({ queryKey: adminKeys.logs.all() });

      // 관리자 대시보드 무효화 (통계 변경)
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}
