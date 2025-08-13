"use client";

import { useOrphanFilesStatusQuery } from "./use-orphan-files-query";
import { useCleanupOrphanFilesMutation } from "./use-orphan-files-mutations";
import type { CleanupResult } from "@/lib/types/system";

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

  const executeCleanup = async (): Promise<CleanupResult> => {
    try {
      const result = await cleanupOrphanFilesMutation.mutateAsync();
      return result;
    } catch (error) {
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
