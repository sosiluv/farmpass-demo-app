"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { farmsKeys, visitorsKeys } from "@/lib/hooks/query/query-keys";
import type { Farm } from "@/lib/types/common";
import type { FarmFormValues } from "@/lib/utils/validation/farm-validation";

/**
 * 농장 생성 Mutation Hook
 */
export function useCreateFarmMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (
      data: FarmFormValues
    ): Promise<{ farm: Farm; message: string }> => {
      const response = await apiClient("/api/farms", {
        method: "POST",
        body: JSON.stringify(data),
        context: "농장 생성",
      });
      return { farm: response.farm, message: response.message };
    },
    onSuccess: (newFarm, variables) => {
      // 사용자의 농장 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: farmsKeys.list({ userId }) });
    },
  });
}

/**
 * 농장 수정 Mutation Hook
 */
export function useUpdateFarmMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (
      data: FarmFormValues & { id: string }
    ): Promise<{ farm: Farm; message: string }> => {
      const response = await apiClient(`/api/farms/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        context: "농장 수정",
      });
      return { farm: response.farm, message: response.message };
    },
    onSuccess: (updatedFarm, variables) => {
      // 사용자의 농장 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: farmsKeys.list({ userId }) });
    },
  });
}

/**
 * 농장 삭제 Mutation Hook
 */
export function useDeleteFarmMutation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (
      farmId: string
    ): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient(`/api/farms/${farmId}`, {
        method: "DELETE",
        context: "농장 삭제",
      });
      return { success: response.success, message: response.message };
    },
    onSuccess: (result, farmId) => {
      // 1. 사용자의 농장 목록 쿼리 무효화

      // 2. 농장 목록에서 삭제된 농장 제거 (즉시 반영)
      queryClient.setQueryData(
        farmsKeys.list({ userId }),
        (oldData: Farm[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter((farm) => farm.id !== farmId);
        }
      );

      // 3. 모든 농장 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: farmsKeys.all });

      // 4. 삭제된 농장의 방문자 데이터도 무효화
      queryClient.invalidateQueries({ queryKey: visitorsKeys.all });
    },
    onError: (error: Error, farmId) => {
      // 404 에러인 경우 (농장이 이미 삭제된 경우) 캐시에서 제거
      if ((error as any).error === "FARM_NOT_FOUND") {
        queryClient.setQueryData(
          farmsKeys.list({ userId }),
          (oldData: Farm[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter((farm) => farm.id !== farmId);
          }
        );

        queryClient.invalidateQueries({ queryKey: farmsKeys.list({ userId }) });
      }
    },
  });
}

/**
 * 농장 Mutation Hook들을 통합한 객체
 */
export function useFarmMutations() {
  const createMutation = useCreateFarmMutation();
  const updateMutation = useUpdateFarmMutation();
  const deleteMutation = useDeleteFarmMutation();

  return {
    // 생성
    createFarm: createMutation.mutate,
    createFarmAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // 수정
    updateFarm: updateMutation.mutate,
    updateFarmAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // 삭제
    deleteFarm: deleteMutation.mutate,
    deleteFarmAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // 전체 상태
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
