"use client";

import { useCleanupSubscriptionsMutation } from "./use-push-mutations";

/**
 * 구독 정리 관리자 통합 Hook
 */
export function useSubscriptionCleanupManager() {
  const cleanupSubscriptionsMutation = useCleanupSubscriptionsMutation();

  const executeCleanup = async (options: {
    realTimeCheck?: boolean;
    forceDelete?: boolean;
    failCountThreshold?: number;
    cleanupInactive?: boolean;
    deleteAfterDays?: number;
  }) => {
    try {
      const result = await cleanupSubscriptionsMutation.mutateAsync(options);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    cleanupLoading: cleanupSubscriptionsMutation.isPending,
    lastCleanupSuccess: cleanupSubscriptionsMutation.isSuccess
      ? cleanupSubscriptionsMutation.data
      : null,
    error: cleanupSubscriptionsMutation.error,
    executeCleanup,
  };
}
