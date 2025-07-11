"use client";

import { useCleanupStatusQuery } from "./use-cleanup-query";
import { useExecuteCleanupMutation } from "./use-cleanup-mutations";

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
