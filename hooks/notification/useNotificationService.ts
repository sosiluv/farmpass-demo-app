import { useState, useCallback } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requestNotificationPermissionAndSubscribe } from "@/lib/utils/notification/push-subscription";

// React Query Hooks
import {
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useCleanupSubscriptionsMutation,
  useSubscriptionStatusQuery,
} from "@/lib/hooks/query/use-push-mutations";
import { useSaveNotificationSettingsMutation } from "@/lib/hooks/query/use-notification-mutations";
import { useNotificationSettingsQuery } from "@/lib/hooks/query/use-notification-settings-query";
import { useVapidKeyEffective } from "@/hooks/auth/useVapidKey";

export function useNotificationService() {
  // 토스트 대신 메시지 상태만 반환
  const [lastMessage, setLastMessage] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { refetch: refetchSubscriptions } = useSubscriptionStatusQuery(false); // 수동으로 조회할 때만 사용
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const deleteSubscriptionMutation = useDeleteSubscriptionMutation();
  const cleanupSubscriptionsMutation = useCleanupSubscriptionsMutation();
  const saveNotificationSettingsMutation =
    useSaveNotificationSettingsMutation();
  const { data: notificationSettings } = useNotificationSettingsQuery({
    enabled: true,
  });

  const { vapidKey } = useVapidKeyEffective();

  // 구독 해제 - React Query 사용
  const handleUnsubscription = async (
    updateSettings: boolean = true,
    subscription?: PushSubscription
  ) => {
    try {
      setIsLoading(true);

      let currentSubscription = subscription;

      // 구독이 전달되지 않은 경우 브라우저에서 찾기
      if (!currentSubscription) {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const existingRegistration =
            await navigator.serviceWorker.getRegistration();
          const registration =
            existingRegistration ??
            ((await Promise.race([
              navigator.serviceWorker.ready,
              new Promise((_, reject) =>
                setTimeout(() => reject("서비스워커 Timeout"), 3000)
              ),
            ])) as ServiceWorkerRegistration);
          const browserSubscription =
            await registration.pushManager.getSubscription();
          currentSubscription = browserSubscription || undefined;
        }
      }

      // 구독이 없으면 적절한 응답 반환
      if (!currentSubscription) {
        setLastMessage({
          type: "success",
          title: "구독 해제 완료",
          message: "구독이 존재하지 않습니다.",
        });
        return { success: true, message: "구독이 존재하지 않습니다." };
      }

      // 1. 브라우저 구독 해제
      await currentSubscription.unsubscribe();

      // 2. 서버 구독 해제 Mutation 사용
      const result = await deleteSubscriptionMutation.mutateAsync({
        endpoint: currentSubscription.endpoint,
        forceDelete: false, // 수동 구독 해제는 인증 사용
        options: {
          updateSettings: updateSettings,
        },
      });

      setLastMessage({
        type: "success",
        title: "구독 해제 성공",
        message: result?.message || "알림 구독이 해제되었습니다",
      });
      return result;
    } catch (error) {
      setLastMessage({
        type: "error",
        title: "구독 해제 실패",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 상태 조회 - React Query 사용
  const getSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      // React Query를 사용하여 구독 상태 조회
      const result = await refetchSubscriptions();

      if (result.error) {
        throw result.error;
      }

      const subscriptionData = result.data || [];

      return { subscriptions: subscriptionData };
    } catch (error) {
      devLog.error("구독 상태 조회 실패:", error);
      setLastMessage({
        type: "error",
        title: "구독 상태 조회 실패",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      });
      return { subscriptions: [] };
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 정리 - React Query Mutation 사용
  const cleanupSubscriptions = async () => {
    try {
      setIsLoading(true);

      // 구독 정리 Mutation 사용
      const result = await cleanupSubscriptionsMutation.mutateAsync({
        realTimeCheck: true,
      });

      setLastMessage({
        type: "success",
        title: "구독 정리 완료",
        message: result.message || "구독 정리가 완료되었습니다",
      });

      return result;
    } catch (error) {
      devLog.error("구독 정리 실패:", error);
      setLastMessage({
        type: "error",
        title: "구독 정리 실패",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 권한 요청 및 구독 처리 - 공통 로직 사용
  const requestNotificationPermission = useCallback(
    async (skipSettingsCheck: boolean = false) => {
      setIsLoading(true);
      try {
        // VAPID 키 사용 (최상위에서 받은 값)
        if (!vapidKey) {
          setLastMessage({
            type: "error",
            title: "VAPID 키 오류",
            message:
              "VAPID 키를 가져올 수 없습니다. 잠시 후 다시 시도해 주세요.",
          });
          return false;
        }

        // 1. 알림 설정 확인 (React Query로 이미 조회된 데이터 사용)
        // 알림 설정 페이지에서는 설정 체크 건너뛰기
        if (!skipSettingsCheck && !notificationSettings?.is_active) {
          setLastMessage({
            type: "error",
            title: "재구독 실패",
            message:
              "알림 설정이 비활성화되어 있습니다. 설정에서 알림을 활성화한 후 다시 시도해주세요.",
          });
          return false;
        }

        // 공통 로직 사용 (알림 설정 페이지용)
        const result = await requestNotificationPermissionAndSubscribe(
          async () => vapidKey,
          async (subscription, deviceId, options) => {
            // 서버에 구독 정보 전송 (device_id 포함)
            const mutationResult = await createSubscriptionMutation.mutateAsync(
              {
                subscription: subscription as PushSubscription,
                deviceId,
                options: {
                  ...options,
                  updateSettings: true, // 알림 설정 페이지에서는 설정 업데이트
                },
              }
            );
            // 구독 성공 시 is_active를 true로 설정
            if (mutationResult.success) {
              await saveNotificationSettingsMutation.mutateAsync({
                is_active: true,
              });
            }
            return mutationResult;
          }
        );
        // 결과에 따른 메시지 설정
        if (result.success) {
          setLastMessage({
            type: "success",
            title: "구독 성공",
            message: result.message || "알림 구독이 완료되었습니다",
          });
          return true;
        } else {
          setLastMessage({
            type: "error",
            title: "알림 설정 실패",
            message: result.message || "알림 설정 중 오류가 발생했습니다.",
          });
          return false;
        }
      } catch (error) {
        devLog.error("알림 권한 요청 실패:", error);
        setLastMessage({
          type: "error",
          title: "알림 설정 실패",
          message: error instanceof Error ? error.message : "알 수 없는 오류",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      vapidKey,
      createSubscriptionMutation,
      saveNotificationSettingsMutation,
      notificationSettings,
    ]
  );

  return {
    isLoading,
    handleUnsubscription,
    getSubscriptionStatus,
    cleanupSubscriptions,
    requestNotificationPermission,
    lastMessage,
    clearLastMessage: () => setLastMessage(null),
  };
}
