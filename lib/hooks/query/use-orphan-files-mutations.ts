"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { cleanupKeys } from "./query-keys";

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

      const result = await apiClient("/api/admin/cleanup-orphan-images", {
        method: "POST",
        context: "Orphan 파일 정리",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[MUTATION] Orphan 파일 정리 완료:", result);
      return result;
    },
    onSuccess: (result) => {
      // Orphan 파일 상태 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: cleanupKeys.orphanFiles(),
      });

      devLog.log(
        `[SUCCESS] Orphan 파일 정리 완료: ${
          result.results.visitor.deleted + result.results.profile.deleted
        }개 파일 삭제`
      );
    },
  });
}
