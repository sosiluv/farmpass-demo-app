"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import { visitorsKeys, dashboardKeys } from "@/lib/hooks/query/query-keys";
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
    mutationFn: async (data: UpdateVisitorRequest): Promise<VisitorEntry> => {
      const response = await apiClient(
        `/api/farms/${data.farm_id}/visitors/${data.id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
          context: "방문자 정보 수정",
          onError: (error, context) => {
            handleError(error, context);
          },
        }
      );
      return response;
    },
    onSuccess: (updatedVisitor, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: visitorsKeys.farm(updatedVisitor.farm_id),
      });
      queryClient.invalidateQueries({
        queryKey: visitorsKeys.farm("all"),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.stats(),
      });
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
    }): Promise<{ success: boolean; visitor?: VisitorEntry }> => {
      const response = await apiClient(
        `/api/farms/${farmId}/visitors/${visitorId}`,
        {
          method: "DELETE",
          context: "방문자 삭제",
          onError: (error, context) => {
            handleError(error, context);
          },
        }
      );
      return response;
    },
    onSuccess: (result, visitorId) => {
      // 모든 방문자 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: visitorsKeys.all,
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.stats(),
      });
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
