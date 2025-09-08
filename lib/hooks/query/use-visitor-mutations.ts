"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { visitorsKeys, adminKeys } from "@/lib/hooks/query/query-keys";
import type { VisitorSheetFormData } from "@/lib/utils/validation/visitor-validation";

/**
 * 방문자 수정 Mutation Hook
 */
export function useUpdateVisitorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: VisitorSheetFormData
    ): Promise<{ success: boolean; message?: string }> => {
      const response = await apiClient(
        `/api/farms/${data.farm_id}/visitors/${data.id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
          context: "방문자 정보 수정",
        }
      );
      return response;
    },
    onSuccess: () => {
      // 해당 농장의 방문자 목록 무효화
      queryClient.invalidateQueries({ queryKey: visitorsKeys.all });

      // 관리자 대시보드 무효화 (방문자 통계 변경)
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

/**
 * 방문자 삭제 Mutation Hook
 */
export function useDeleteVisitorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitorId,
      farmId,
    }: {
      visitorId: string;
      farmId: string;
    }): Promise<{
      success: boolean;
      message?: string;
    }> => {
      const response = await apiClient(
        `/api/farms/${farmId}/visitors/${visitorId}`,
        {
          method: "DELETE",
          context: "방문자 삭제",
        }
      );
      return response;
    },
    onSuccess: (result, { farmId }) => {
      // 해당 농장의 방문자 목록 무효화
      queryClient.invalidateQueries({ queryKey: visitorsKeys.all });

      // 관리자 대시보드 무효화 (방문자 통계 변경)
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

/**
 * 방문자 Mutation Hook들을 통합한 객체
 */
export function useVisitorMutations() {
  const updateMutation = useUpdateVisitorMutation();
  const deleteMutation = useDeleteVisitorMutation();

  return {
    // 수정
    updateVisitor: updateMutation.mutate,
    updateVisitorAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // 삭제
    deleteVisitor: deleteMutation.mutate,
    deleteVisitorAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // 전체 상태
    isLoading: updateMutation.isPending || deleteMutation.isPending,
  };
}
