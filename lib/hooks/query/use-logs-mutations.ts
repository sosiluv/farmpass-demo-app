"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";

interface DeleteLogRequest {
  action: "delete_single" | "delete_all" | "delete_old";
  logId?: string;
}

/**
 * 로그 삭제 Mutation
 * 토스트는 컴포넌트 레벨에서 처리
 */
export function useDeleteLogsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteLogRequest) => {
      const result = await apiClient("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return result;
    },
    onSuccess: () => {
      // 로그 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["admin", "logs"],
        exact: false,
      });
    },
  });
}
