"use client";

import { useOrphanFilesStatusQuery } from "./use-orphan-files-query";
import { useCleanupOrphanFilesMutation } from "./use-orphan-files-mutations";

/**
 * Orphan 파일 관리자 통합 Hook
 */
export function useOrphanFilesManager() {
  const {
    data: orphanFilesStatus,
    isLoading: statusLoading,
    error,
    refetch: fetchOrphanFilesStatus,
  } = useOrphanFilesStatusQuery();

  const cleanupOrphanFilesMutation = useCleanupOrphanFilesMutation();

  const executeCleanup = async () => {
    try {
      await cleanupOrphanFilesMutation.mutateAsync();
    } catch (error) {
      // 에러는 React Query에서 자동 처리
      throw error;
    }
  };

  return {
    orphanFilesStatus,
    orphanFilesLoading: cleanupOrphanFilesMutation.isPending,
    statusLoading,
    lastCleanupSuccess: cleanupOrphanFilesMutation.isSuccess
      ? `${
          cleanupOrphanFilesMutation.data?.results.visitor.deleted +
          cleanupOrphanFilesMutation.data?.results.profile.deleted
        }개 파일`
      : null,
    error: error || cleanupOrphanFilesMutation.error,
    fetchOrphanFilesStatus,
    executeCleanup,
  };
}
