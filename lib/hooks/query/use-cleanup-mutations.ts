"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { settingsKeys, adminKeys } from "./query-keys";

/**
 * 정리 작업 실행 Mutation Hook
 */
export function useExecuteCleanupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: "system_logs" | "all";
    }): Promise<{ success: boolean; message: string; results: any }> => {
      devLog.log("[MUTATION] 정리 작업 시작:", data.type);

      const result = await apiClient("/api/admin/logs/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        context: "정리 작업 실행",
      });

      devLog.log("[MUTATION] 정리 작업 완료:", result);
      return result;
    },
    onSuccess: (result, variables) => {
      // 정리 상태 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: settingsKeys.cleanup.status(),
      });
      // 로그 데이터 무효화 (정리로 인한 영향)
      queryClient.invalidateQueries({
        queryKey: adminKeys.logs.all(),
      });
      // 관리자 대시보드 통계 무효화 (로그 정리로 인한 통계 변경)
      queryClient.invalidateQueries({
        queryKey: adminKeys.dashboard(),
      });
    },
  });
}
