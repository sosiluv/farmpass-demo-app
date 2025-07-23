import { useCallback } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { createSubscriptionFromExisting } from "@/lib/utils/notification/push-subscription";

// React Query Hooks
import {
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
} from "@/lib/hooks/query/use-push-mutations";
import { settingsKeys } from "@/lib/hooks/query/query-keys";
import { useVapidKeyEffective } from "@/hooks/useVapidKey";

export function useSubscriptionManager() {
  const queryClient = useQueryClient();

  // VAPID 키를 훅 최상위에서 호출
  const {
    vapidKey,
    isLoading: vapidKeyLoading,
    error: vapidKeyError,
  } = useVapidKeyEffective();

  // React Query Hooks - Lazy Loading으로 최적화
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const deleteSubscriptionMutation = useDeleteSubscriptionMutation();

  // 알림 설정을 동적으로 조회하는 함수 (React Query 사용)
  const getUserNotificationSettings = async (userId: string) => {
    try {
      // useNotificationSettingsQuery와 동일한 로직 사용
      // 캐시를 무효화하여 항상 새로운 데이터 조회 (사용자 전환 시 캐시 문제 방지)
      const data = await queryClient.fetchQuery({
        queryKey: settingsKeys.notifications(),
        queryFn: async () => {
          const response = await apiClient("/api/notifications/settings", {
            method: "GET",
            context: "알림 설정 조회 (구독 관리용)",
          });
          return response;
        },
        staleTime: 0, // 항상 새로운 데이터 조회
        gcTime: 0, // 캐시 유지하지 않음
      });

      return data;
    } catch (error) {
      return null;
    }
  };

  // Base64 to Uint8Array 변환
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // 현재 구독 해제
  const unsubscribeCurrent = async (): Promise<boolean> => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return true; // 지원하지 않는 브라우저는 성공으로 처리
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 브라우저에서 구독 해제
        await subscription.unsubscribe();

        // 서버에서도 구독 해제 (endpoint가 있을 때만)
        if (subscription.endpoint) {
          const result = await deleteSubscriptionMutation.mutateAsync({
            endpoint: subscription.endpoint,
            forceDelete: true, // 사용자 전환 시 강제 삭제
            options: {
              updateSettings: false, // 사용자 전환 시에는 설정 업데이트 안함
            },
          });
        }
      }

      return true;
    } catch (error) {
      devLog.error("구독 해제 실패:", error);
      return false;
    }
  };

  // 새 사용자로 구독 전환 - 공통 로직 사용
  const switchSubscription = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        // 1. 브라우저 지원 확인
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          devLog.warn("브라우저에서 푸시 알림을 지원하지 않습니다.");
          return false;
        }

        // 2. 기존 구독 해제
        await unsubscribeCurrent();

        // 3. 사용자의 알림 설정 확인
        const currentNotificationSettings = await getUserNotificationSettings(
          userId
        );

        // 4. 알림 설정이 비활성화되어 있으면 구독하지 않음
        if (
          !currentNotificationSettings ||
          !currentNotificationSettings.is_active
        ) {
          devLog.log(
            `사용자 ${userId}의 알림 설정이 비활성화되어 있어 구독을 생성하지 않습니다.`
          );
          return true; // 설정상 구독하지 않는 것이므로 성공으로 처리
        }

        // 5. VAPID 키 사용 (최상위에서 받은 값)
        if (!vapidKey) {
          devLog.warn("VAPID 키를 가져올 수 없습니다.");
          return false;
        }

        // 6. 새 구독 생성 (공통 로직 사용)
        const registration = await navigator.serviceWorker.ready;
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // 7. 서버에 구독 정보 전송 (공통 로직 사용)
        const result = await createSubscriptionFromExisting(
          async (subscription, deviceId, options) => {
            return await createSubscriptionMutation.mutateAsync({
              subscription: subscription as PushSubscription,
              deviceId,
              options: {
                ...options,
                updateSettings: true, // 사용자 전환 시에도 설정 업데이트
              },
            });
          },
          {
            updateSettings: false,
          }
        );

        if (result.success) {
          devLog.log(`구독 전환 완료: ${userId}`);
          return true;
        } else {
          devLog.error(`구독 전환 실패: ${userId}`, result.message);
          return false;
        }
      } catch (error) {
        devLog.error(`구독 전환 중 오류 발생: ${userId}`, error);
        handleError(error, { context: "switch-subscription" });
        return false;
      }
    },
    [vapidKey, createSubscriptionMutation, deleteSubscriptionMutation]
  );

  // 구독 정리 (사용자 로그아웃 시)
  const cleanupSubscription = useCallback(async (): Promise<boolean> => {
    try {
      let endpoint: string | undefined = undefined;

      // 브라우저에서 구독 해제 및 endpoint 추출
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
          devLog.log("브라우저 구독 해제 완료");
        }
      }

      // endpoint가 있을 때만 서버에 요청
      if (endpoint) {
        await deleteSubscriptionMutation.mutateAsync({
          endpoint,
          forceDelete: true,
        });
      } else {
        devLog.warn("[CLEANUP] endpoint가 없어 서버 호출을 생략합니다.");
      }
      return true;
    } catch (error) {
      devLog.error("[CLEANUP] 구독 정리 실패:", error);
      handleError(error, { context: "cleanup-subscription" });
      return false;
    }
  }, [deleteSubscriptionMutation]);

  return {
    switchSubscription,
    cleanupSubscription,
  };
}
