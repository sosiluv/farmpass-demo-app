"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import type { SystemSettings } from "@/lib/types/settings";

/**
 * 시스템 설정 저장 Mutation Hook
 */
export function useSaveSystemSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: Partial<SystemSettings>
    ): Promise<SystemSettings> => {
      const response = await apiClient("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      return response;
    },
    onSuccess: (updatedSettings) => {
      // 시스템 설정 쿼리 즉시 업데이트
      queryClient.setQueryData(["system-settings"], updatedSettings);

      // 시스템 설정 쿼리 무효화 (다른 캐시들도 갱신)
      queryClient.invalidateQueries({
        queryKey: ["system-settings"],
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
      });
      return { success: true };
    },
    onSuccess: () => {
      // React Query 캐시도 무효화
      queryClient.invalidateQueries({
        queryKey: ["system-settings"],
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
      });
      return response;
    },
  });
}

/**
 * 이미지 업로드 관련 Mutation Hook
 */
export function useUploadSystemImageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      type: "logo" | "favicon" | "notificationIcon" | "notificationBadge";
    }): Promise<{
      success: boolean;
      url?: string;
      fileName?: string;
    }> => {
      // 실제 이미지 업로드 로직은 useUniversalImageManager에서 처리
      // 여기서는 시스템 설정 업데이트만 담당
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("type", data.type);

      const response = await apiClient("/api/settings/upload-image", {
        method: "POST",
        body: formData,
      });
      return response;
    },
    onSuccess: () => {
      // 시스템 설정 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["system-settings"],
      });
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
  const uploadImage = useUploadSystemImageMutation();

  return {
    saveSettings,
    invalidateCache,
    executeCleanup,
    uploadImage,

    // 편의 메서드들
    saveSettingsAsync: saveSettings.mutateAsync,
    invalidateCacheAsync: invalidateCache.mutateAsync,
    executeCleanupAsync: executeCleanup.mutateAsync,
    uploadImageAsync: uploadImage.mutateAsync,

    // 로딩 상태
    isLoading:
      saveSettings.isPending ||
      invalidateCache.isPending ||
      executeCleanup.isPending ||
      uploadImage.isPending,
  };
}
