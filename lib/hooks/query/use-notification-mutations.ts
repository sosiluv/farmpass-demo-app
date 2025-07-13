"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import type {
  NotificationSettings,
  UpdateNotificationSettingsDTO,
} from "@/lib/types/notification";

/**
 * 알림 설정 저장 Mutation Hook
 */
export function useSaveNotificationSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: UpdateNotificationSettingsDTO
    ): Promise<
      { success: boolean; message?: string } & NotificationSettings
    > => {
      const response = await apiClient("/api/notifications/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
        context: "알림 설정 저장",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return response;
    },
    onSuccess: () => {
      // 알림 설정 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });
    },
  });
}

/**
 * 푸시 구독 등록 Mutation Hook
 */
export function useSubscribePushMutation() {
  return useMutation({
    mutationFn: async (
      subscription: PushSubscription
    ): Promise<{ success: boolean; message?: string }> => {
      const result = await apiClient("/api/push/subscription", {
        method: "POST",
        body: JSON.stringify({ subscription: subscription.toJSON() }),
        context: "푸시 구독 등록",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return result;
    },
  });
}

/**
 * 푸시 구독 해제 Mutation Hook
 */
export function useUnsubscribePushMutation() {
  return useMutation({
    mutationFn: async (data: {
      endpoint: string;
      farmId?: string;
    }): Promise<{ success: boolean; message?: string }> => {
      const result = await apiClient("/api/push/subscription", {
        method: "DELETE",
        body: JSON.stringify(data),
        context: "푸시 구독 해제",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return result;
    },
  });
}

/**
 * 푸시 알림 전송 Mutation Hook
 */
export function useSendPushNotificationMutation() {
  return useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      notificationType: string;
      farmId?: string;
      targetUserIds?: string[];
    }): Promise<{ success: boolean; sentCount?: number; message?: string }> => {
      const response = await apiClient("/api/push/send", {
        method: "POST",
        body: JSON.stringify(data),
        context: "푸시 알림 전송",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return response;
    },
  });
}

/**
 * 알림 설정 업데이트 (구독 상태 변경) Mutation Hook
 */
export function useUpdateNotificationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      is_active: boolean;
    }): Promise<NotificationSettings> => {
      const response = await apiClient("/api/notifications/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      // 알림 설정 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });
    },
  });
}

/**
 * VAPID 키 생성 Mutation Hook
 */
export function useGenerateVapidKeysMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      success: boolean;
      publicKey: string;
      privateKey: string;
      message?: string;
      warning?: string;
    }> => {
      const response = await apiClient("/api/push/vapid", {
        method: "POST",
      });
      return response;
    },
    onSuccess: () => {
      // 시스템 설정 쿼리 무효화 (VAPID 키가 시스템 설정에 포함)
      queryClient.invalidateQueries({
        queryKey: ["system-settings"],
      });
    },
  });
}

/**
 * 알림 관련 Mutation Hook들을 통합한 객체
 */
export function useNotificationMutations() {
  const saveSettings = useSaveNotificationSettingsMutation();
  const subscribePush = useSubscribePushMutation();
  const unsubscribePush = useUnsubscribePushMutation();
  const sendPushNotification = useSendPushNotificationMutation();
  const updateStatus = useUpdateNotificationStatusMutation();
  const generateVapidKeys = useGenerateVapidKeysMutation();

  return {
    saveSettings,
    subscribePush,
    unsubscribePush,
    sendPushNotification,
    updateStatus,
    generateVapidKeys,

    // 편의 메서드들
    saveSettingsAsync: saveSettings.mutateAsync,
    subscribePushAsync: subscribePush.mutateAsync,
    unsubscribePushAsync: unsubscribePush.mutateAsync,
    sendPushNotificationAsync: sendPushNotification.mutateAsync,
    updateStatusAsync: updateStatus.mutateAsync,
    generateVapidKeysAsync: generateVapidKeys.mutateAsync,

    // 로딩 상태
    isLoading:
      saveSettings.isPending ||
      subscribePush.isPending ||
      unsubscribePush.isPending ||
      sendPushNotification.isPending ||
      updateStatus.isPending ||
      generateVapidKeys.isPending,
  };
}
