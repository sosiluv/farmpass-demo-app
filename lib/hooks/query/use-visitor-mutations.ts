"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { visitorsKeys, adminKeys } from "@/lib/hooks/query/query-keys";
import type { VisitorEntry } from "@/lib/types";

export interface CreateVisitorRequest {
  farm_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_purpose?: string;
  vehicle_number?: string;
  notes?: string;
  disinfection_check: boolean;
  consent_given: boolean;
  visit_datetime?: string;
}

export interface UpdateVisitorRequest extends Partial<CreateVisitorRequest> {
  id: string;
  farm_id: string; // farm_id 필수로 추가
}

/**
 * 방문자 수정 Mutation Hook
 */
export function useUpdateVisitorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateVisitorRequest
    ): Promise<{ success: boolean; message?: string } & VisitorEntry> => {
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
    onSuccess: (updatedVisitor, variables) => {
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
      visitor?: VisitorEntry;
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
