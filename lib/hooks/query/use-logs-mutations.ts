"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { adminKeys } from "./query-keys";

interface DeleteLogRequest {
  action: "delete_single" | "delete_all" | "delete_old";
  logId?: string;
  beforeCount?: number; // 전체 삭제 시 현재 로그 개수
}

/**
 * 로그 삭제 Mutation
 * 기본 에러 처리는 Hook 레벨에서, 추가 처리는 컴포넌트 레벨에서 가능
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
        context: "로그 삭제",
      });
      return result;
    },
    onSuccess: () => {
      // 로그 전체 무효화
      queryClient.invalidateQueries({
        queryKey: adminKeys.logs.all(),
      });
      // 관리자 대시보드 통계 무효화
      queryClient.invalidateQueries({
        queryKey: adminKeys.dashboard(),
      });
    },
  });
}
