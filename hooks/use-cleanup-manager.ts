"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { CleanupStatus } from "@/lib/types/settings";

/**
 * 정리 상태 조회 Query Hook
 */
export function useCleanupStatusQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return useAuthenticatedQuery(
    ["cleanup-status"],
    async (): Promise<CleanupStatus> => {
      devLog.log("[QUERY] 정리 상태 조회 시작");

      const data = await apiClient("/api/admin/logs/cleanup", {
        method: "GET",
        context: "정리 상태 조회",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[QUERY] 정리 상태 조회 완료:", data);
      return data;
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 2, // 2분간 fresh
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
    }
  );
}

/**
 * 정리 작업 실행 Mutation Hook
 */
export function useExecuteCleanupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: "system_logs" | "all";
    }): Promise<{ success: boolean; deletedCount?: number }> => {
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
        queryKey: ["cleanup-status"],
      });

      devLog.log(
        `[SUCCESS] ${
          variables.type === "all" ? "모든 데이터" : "시스템 로그"
        } 정리 완료`
      );
    },
  });
}

/**
 * 정리 관리자 통합 Hook
 */
export function useCleanupManager() {
  const {
    data: cleanupStatus,
    isLoading: statusLoading,
    error,
    refetch: fetchCleanupStatus,
  } = useCleanupStatusQuery();

  const executeCleanupMutation = useExecuteCleanupMutation();

  const executeCleanup = async (type: "system_logs" | "all") => {
    try {
      await executeCleanupMutation.mutateAsync({ type });
    } catch (error) {
      // 에러는 React Query에서 자동 처리
      throw error;
    }
  };

  return {
    cleanupStatus,
    cleanupLoading: executeCleanupMutation.isPending,
    statusLoading,
    lastCleanupSuccess: executeCleanupMutation.isSuccess
      ? executeCleanupMutation.variables?.type === "all"
        ? "모든 데이터"
        : "시스템 로그"
      : null,
    error: error || executeCleanupMutation.error,
    fetchCleanupStatus,
    executeCleanup,
  };
}
