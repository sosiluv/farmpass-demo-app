"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import {
  createVisitorQueryKey,
  createDashboardStatsQueryKey,
} from "@/lib/hooks/query-utils";
import type { VisitorEntry } from "@/lib/types";

export interface CreateVisitorRequest {
  farm_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_purpose?: string;
  disinfection_check: boolean;
  consent_given: boolean;
  visit_datetime?: string;
}

export interface UpdateVisitorRequest extends Partial<CreateVisitorRequest> {
  id: string;
}

/**
 * 방문자 생성 Mutation Hook
 * 페이지에서 토스트 메시지 처리
 */
export function useCreateVisitorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVisitorRequest): Promise<VisitorEntry> => {
      const response = await apiClient("/api/visitors", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.visitor;
    },
    onSuccess: (newVisitor, variables) => {
      // 관련 쿼리 무효화만 수행
      queryClient.invalidateQueries({
        queryKey: createVisitorQueryKey(variables.farm_id),
      });
      queryClient.invalidateQueries({
        queryKey: createVisitorQueryKey(null),
      });
      queryClient.invalidateQueries({
        queryKey: createDashboardStatsQueryKey(variables.farm_id),
      });
      queryClient.invalidateQueries({
        queryKey: createDashboardStatsQueryKey(undefined),
      });
    },
  });
}

/**
 * 방문자 수정 Mutation Hook
 */
export function useUpdateVisitorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVisitorRequest): Promise<VisitorEntry> => {
      const response = await apiClient(`/api/visitors/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.visitor;
    },
    onSuccess: (updatedVisitor, variables) => {
      queryClient.invalidateQueries({
        queryKey: createVisitorQueryKey(updatedVisitor.farm_id),
      });
      queryClient.invalidateQueries({
        queryKey: createVisitorQueryKey(null),
      });
      queryClient.invalidateQueries({
        queryKey: createDashboardStatsQueryKey(updatedVisitor.farm_id),
      });
      queryClient.invalidateQueries({
        queryKey: createDashboardStatsQueryKey(undefined),
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
    mutationFn: async (
      visitorId: string
    ): Promise<{ success: boolean; visitor?: VisitorEntry }> => {
      const response = await apiClient(`/api/visitors/${visitorId}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: (result, visitorId) => {
      // 모든 방문자 관련 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [type] = query.queryKey;
          return type === "visitors" || type === "dashboardStats";
        },
      });
    },
  });
}

/**
 * 방문자 일괄 삭제 Mutation Hook
 */
export function useBulkDeleteVisitorsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      visitorIds: string[]
    ): Promise<{ success: boolean; deletedCount: number }> => {
      const response = await apiClient("/api/visitors/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: visitorIds }),
      });
      return response;
    },
    onSuccess: (result, visitorIds) => {
      // 모든 방문자 관련 쿼리 무효화
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [type] = query.queryKey;
          return type === "visitors" || type === "dashboardStats";
        },
      });
    },
  });
}

/**
 * 방문자 Mutation Hook들을 통합한 객체
 */
export function useVisitorMutations() {
  const createMutation = useCreateVisitorMutation();
  const updateMutation = useUpdateVisitorMutation();
  const deleteMutation = useDeleteVisitorMutation();
  const bulkDeleteMutation = useBulkDeleteVisitorsMutation();

  return {
    // 생성
    createVisitor: createMutation.mutate,
    createVisitorAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

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

    // 일괄 삭제
    bulkDeleteVisitors: bulkDeleteMutation.mutate,
    bulkDeleteVisitorsAsync: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    bulkDeleteError: bulkDeleteMutation.error,

    // 전체 상태
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      bulkDeleteMutation.isPending,
  };
}
