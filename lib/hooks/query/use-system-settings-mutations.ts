"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import { settingsKeys } from "@/lib/hooks/query/query-keys";
import type { SystemSettings } from "@/lib/types/settings";

/**
 * 시스템 설정 저장 Mutation Hook
 */
export function useSaveSystemSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: Partial<SystemSettings>
    ): Promise<
      {
        success: boolean;
        message?: string;
        changedFields?: string[];
      } & SystemSettings
    > => {
      const response = await apiClient("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
        context: "시스템 설정 저장",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return response;
    },
    onSuccess: (updatedSettings) => {
      // 시스템 설정 쿼리 즉시 업데이트
      queryClient.setQueryData(settingsKeys.system(), updatedSettings);

      // 시스템 설정 쿼리 무효화 (다른 캐시들도 갱신)
      queryClient.invalidateQueries({
        queryKey: settingsKeys.all,
      });
    },
  });
}

/**
 * 시스템 설정 캐시 무효화 Mutation Hook
 */
export function useInvalidateSystemSettingsCacheMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean }> => {
      await apiClient("/api/settings/invalidate-cache", {
        method: "POST",
        context: "시스템 설정 캐시 무효화",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return { success: true };
    },
    onSuccess: () => {
      // React Query 캐시도 무효화
      queryClient.invalidateQueries({
        queryKey: settingsKeys.all,
      });
    },
  });
}

/**
 * 시스템 정리 작업 실행 Mutation Hook
 */
export function useExecuteCleanupMutation() {
  return useMutation({
    mutationFn: async (data: {
      type: "visitor_entries" | "system_logs";
      retentionDays?: number;
      dryRun?: boolean;
    }): Promise<{
      success: boolean;
      deletedCount?: number;
      executionId?: string;
    }> => {
      const response = await apiClient("/api/cleanup", {
        method: "POST",
        body: JSON.stringify(data),
        context: "데이터 정리 작업",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return response;
    },
  });
}

/**
 * 시스템 설정 관련 Mutation Hook들을 통합한 객체
 */
export function useSystemSettingsMutations() {
  const saveSettings = useSaveSystemSettingsMutation();
  const invalidateCache = useInvalidateSystemSettingsCacheMutation();
  const executeCleanup = useExecuteCleanupMutation();

  return {
    saveSettings,
    invalidateCache,
    executeCleanup,

    // 편의 메서드들
    saveSettingsAsync: saveSettings.mutateAsync,
    invalidateCacheAsync: invalidateCache.mutateAsync,
    executeCleanupAsync: executeCleanup.mutateAsync,

    // 로딩 상태
    isLoading:
      saveSettings.isPending ||
      invalidateCache.isPending ||
      executeCleanup.isPending,
  };
}
