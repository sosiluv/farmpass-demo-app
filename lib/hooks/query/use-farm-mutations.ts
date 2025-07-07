"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import {
  createFarmQueryKey,
  createVisitorQueryKey,
} from "@/lib/hooks/query-utils";
import type { Farm } from "@/lib/types/farm";

export interface CreateFarmRequest {
  farm_name: string;
  farm_type?: string;
  farm_address: string;
  farm_detailed_address?: string;
  manager_name?: string;
  manager_phone?: string;
  description?: string;
}

export interface UpdateFarmRequest extends Partial<CreateFarmRequest> {
  id: string;
}

/**
 * 농장 생성 Mutation Hook
 */
export function useCreateFarmMutation() {
  const queryClient = useQueryClient();
  const { state } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateFarmRequest): Promise<Farm> => {
      const response = await apiClient("/api/farms", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.farm;
    },
    onSuccess: (newFarm, variables) => {
      // 사용자의 농장 목록 쿼리 무효화
      const userId =
        state.status === "authenticated" ? state.user?.id : undefined;
      queryClient.invalidateQueries({
        queryKey: createFarmQueryKey(userId),
      });
    },
  });
}

/**
 * 농장 수정 Mutation Hook
 */
export function useUpdateFarmMutation() {
  const queryClient = useQueryClient();
  const { state } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateFarmRequest): Promise<Farm> => {
      const response = await apiClient(`/api/farms/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.farm;
    },
    onSuccess: (updatedFarm, variables) => {
      // 사용자의 농장 목록 쿼리 무효화
      const userId =
        state.status === "authenticated" ? state.user?.id : undefined;
      queryClient.invalidateQueries({
        queryKey: createFarmQueryKey(userId),
      });
    },
  });
}

/**
 * 농장 삭제 Mutation Hook
 */
export function useDeleteFarmMutation() {
  const queryClient = useQueryClient();
  const { state } = useAuth();

  return useMutation({
    mutationFn: async (
      farmId: string
    ): Promise<{ success: boolean; farm?: Farm }> => {
      const response = await apiClient(`/api/farms/${farmId}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: (result, farmId) => {
      // 1. 사용자의 농장 목록 쿼리 무효화
      const userId =
        state.status === "authenticated" ? state.user?.id : undefined;
      queryClient.invalidateQueries({
        queryKey: createFarmQueryKey(userId),
      });

      // 2. 농장 목록에서 삭제된 농장 제거 (즉시 반영)
      queryClient.setQueryData(
        createFarmQueryKey(userId),
        (oldData: Farm[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter((farm) => farm.id !== farmId);
        }
      );

      // 3. 삭제된 농장과 관련된 모든 쿼리 제거
      queryClient.removeQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          const [type, id] = queryKey;
          return (
            (type === "visitors" && id === farmId) ||
            (type === "farmMembers" && id === farmId) ||
            (type === "dashboardStats" && id === farmId) ||
            (type === "farm" && id === farmId)
          );
        },
      });

      // 4. 전체 농장 목록 쿼리도 무효화 (다른 사용자의 농장 목록도 업데이트)
      queryClient.invalidateQueries({
        queryKey: ["farms"],
        exact: false,
      });
    },
    onError: (error: Error, farmId) => {
      // 404 에러인 경우 (농장이 이미 삭제된 경우) 캐시에서 제거
      if (error.message.includes("Farm not found")) {
        const userId =
          state.status === "authenticated" ? state.user?.id : undefined;
        queryClient.setQueryData(
          createFarmQueryKey(userId),
          (oldData: Farm[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter((farm) => farm.id !== farmId);
          }
        );

        queryClient.invalidateQueries({
          queryKey: createFarmQueryKey(userId),
        });
      }
    },
  });
}

/**
 * 농장 활성/비활성 상태 변경 Mutation Hook
 */
export function useToggleFarmStatusMutation() {
  const queryClient = useQueryClient();
  const { state } = useAuth();

  return useMutation({
    mutationFn: async ({
      farmId,
      isActive,
    }: {
      farmId: string;
      isActive: boolean;
    }): Promise<Farm> => {
      const response = await apiClient(`/api/farms/${farmId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: isActive }),
      });
      return response.farm;
    },
    onSuccess: (updatedFarm, variables) => {
      // 사용자의 농장 목록 쿼리 무효화
      const userId =
        state.status === "authenticated" ? state.user?.id : undefined;
      queryClient.invalidateQueries({
        queryKey: createFarmQueryKey(userId),
      });
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
  const toggleStatusMutation = useToggleFarmStatusMutation();

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

    // 상태 변경
    toggleFarmStatus: toggleStatusMutation.mutate,
    toggleFarmStatusAsync: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,
    toggleStatusError: toggleStatusMutation.error,

    // 전체 상태
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleStatusMutation.isPending,
  };
}
