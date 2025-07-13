"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { cleanupKeys } from "./query-keys";

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
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[MUTATION] 정리 작업 완료:", result);
      return result;
    },
    onSuccess: (result, variables) => {
      // 정리 상태 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: cleanupKeys.status(),
      });

      devLog.log(
        `[SUCCESS] ${
          variables.type === "all" ? "모든 데이터" : "시스템 로그"
        } 정리 완료`
      );
    },
  });
}
