"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { settingsKeys, adminKeys } from "./query-keys";

interface CleanupResult {
  success: boolean;
  message: string;
  results: {
    visitor: { deleted: number; total: number };
    profile: { deleted: number; total: number };
  };
}

/**
 * Orphan 파일 정리 Mutation Hook
 */
export function useCleanupOrphanFilesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CleanupResult> => {
      devLog.log("[MUTATION] Orphan 파일 정리 시작");

      const result = await apiClient("/api/admin/orphan-files/cleanup", {
        method: "POST",
        context: "Orphan 파일 정리",
      });

      devLog.log("[MUTATION] Orphan 파일 정리 완료:", result);
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

      devLog.log(
        `[SUCCESS] Orphan 파일 정리 완료: ${
          result.results.visitor.deleted + result.results.profile.deleted
        }개 파일 삭제`
      );
    },
  });
}
