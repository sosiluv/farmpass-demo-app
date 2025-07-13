import { useState, useCallback } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getNotificationErrorMessage } from "@/lib/utils/validation/validation";
import { safeNotificationAccess } from "@/lib/utils/browser/safari-compat";

// React Query Hooks
import {
  useVapidKeyQuery,
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useSendTestPushMutation,
  useCleanupSubscriptionsMutation,
  useSubscriptionStatusQuery,
} from "@/lib/hooks/query/use-push-mutations";
import { useSaveNotificationSettingsMutation } from "@/lib/hooks/query/use-notification-mutations";

export function useNotificationService(enableVapidKey: boolean = false) {
  // 토스트 대신 메시지 상태만 반환
  const [lastMessage, setLastMessage] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // React Query Hooks - VAPID key는 필요할 때만 조회
  const { data: vapidKey } = useVapidKeyQuery({ enabled: enableVapidKey });
  const { data: subscriptions, refetch: refetchSubscriptions } =
    useSubscriptionStatusQuery(false); // 수동으로 조회할 때만 사용
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const deleteSubscriptionMutation = useDeleteSubscriptionMutation();
  const sendTestPushMutation = useSendTestPushMutation();
  const cleanupSubscriptionsMutation = useCleanupSubscriptionsMutation();
  const saveNotificationSettingsMutation =
    useSaveNotificationSettingsMutation();

  // VAPID 키 관리 - React Query 캐시 사용
  const getVapidPublicKey = async () => {
    try {
      devLog.log("[NOTIFICATION] VAPID 키 조회 시작");

      // React Query 캐시된 데이터 사용
      if (vapidKey) {
        return vapidKey;
      }

      devLog.warn("VAPID 키가 아직 로드되지 않음");
      return null;
    } catch (error) {
      devLog.error("VAPID 키 조회 실패:", error);
      return null;
    }
  };

  // 구독 관리 - React Query 사용
  const handleSubscription = async (
    subscription: PushSubscription,
    farmId?: string
  ) => {
    try {
      setIsLoading(true);
      devLog.log("[NOTIFICATION] 푸시 알림 구독 시작", { farmId });

      // 구독 생성 Mutation 사용
      const result = await createSubscriptionMutation.mutateAsync({
        subscription: subscription.toJSON(),
        farmId,
      });

      // 구독 성공 시 is_active를 true로 설정 - Mutation 사용
      await saveNotificationSettingsMutation.mutateAsync({ is_active: true });

      setLastMessage({
        type: "success",
        title: "구독 성공",
        message: result?.message || "알림 구독이 완료되었습니다",
      });
      return result;
    } catch (error) {
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "구독 실패",
        message: notificationError.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 해제 - React Query 사용
  const handleUnsubscription = async (
    subscription: PushSubscription,
    farmId?: string
  ) => {
    try {
      setIsLoading(true);

      // 구독 해제 Mutation 사용
      const result = await deleteSubscriptionMutation.mutateAsync(
        subscription.endpoint
      );

      // 구독 해제 시 is_active를 false로 설정 - Mutation 사용
      await saveNotificationSettingsMutation.mutateAsync({ is_active: false });

      setLastMessage({
        type: "success",
        title: "구독 해제 성공",
        message: result?.message || "알림 구독이 해제되었습니다",
      });
      return result;
    } catch (error) {
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "구독 해제 실패",
        message: notificationError.message,
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
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "구독 상태 조회 실패",
        message: notificationError.message,
      });
      return { subscriptions: [] };
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 알림 발송 - React Query 사용
  const sendTestNotification = async () => {
    try {
      const result = await sendTestPushMutation.mutateAsync({
        title: "테스트 알림",
        body: "푸시 알림이 정상적으로 작동하고 있습니다! 🎉",
      });

      setLastMessage({
        type: "success",
        title: "테스트 알림 발송",
        message: result?.message || "테스트 알림이 발송되었습니다",
      });
    } catch (error) {
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "테스트 실패",
        message: notificationError.message,
      });
    }
  };

  // 구독 정리 - React Query Mutation 사용
  const cleanupSubscriptions = async () => {
    try {
      setIsLoading(true);
      devLog.log("[NOTIFICATION] 구독 정리 시작");

      // 구독 정리 Mutation 사용
      const result = await cleanupSubscriptionsMutation.mutateAsync({
        realTimeCheck: false,
      });

      setLastMessage({
        type: "success",
        title: "구독 정리 완료",
        message: result.message || "구독 정리가 완료되었습니다",
      });

      return result;
    } catch (error) {
      devLog.error("구독 정리 실패:", error);
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "구독 정리 실패",
        message: notificationError.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 권한 요청 및 구독 처리
  const requestNotificationPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const safeNotification = safeNotificationAccess();

      if (!safeNotification.isSupported) {
        throw new Error("이 브라우저는 알림을 지원하지 않습니다.");
      }

      if (safeNotification.permission === "denied") {
        throw new Error("알림 권한이 거부되었습니다.");
      }

      // 권한 요청
      const permission = await safeNotification.requestPermission();

      if (permission === "granted") {
        const currentVapidKey = await getVapidPublicKey();
        if (!currentVapidKey)
          throw new Error("VAPID 키가 설정되지 않았습니다.");

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(currentVapidKey),
        });

        await handleSubscription(subscription);
        return true;
      } else {
        throw new Error("알림 권한이 허용되지 않았습니다.");
      }
    } catch (error) {
      devLog.error("알림 권한 요청 실패:", error);
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "알림 설정 실패",
        message: notificationError.message,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [createSubscriptionMutation, saveNotificationSettingsMutation]);

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

  return {
    isLoading,
    getVapidPublicKey,
    handleSubscription,
    handleUnsubscription,
    getSubscriptionStatus,
    sendTestNotification,
    cleanupSubscriptions,
    requestNotificationPermission,
    lastMessage,
    clearLastMessage: () => setLastMessage(null),
  };
}
