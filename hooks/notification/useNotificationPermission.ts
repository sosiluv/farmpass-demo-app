"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  safeLocalStorageAccess,
  safeNotificationAccess,
} from "@/lib/utils/browser/safari-compat";
import { useCreateSubscriptionMutation } from "@/lib/hooks/query/use-push-mutations";
import { requestNotificationPermissionAndSubscribe } from "@/lib/utils/notification/push-subscription";
import { useVapidKeyEffective } from "@/hooks/auth/useVapidKey";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

interface NotificationPermissionState {
  hasAsked: boolean;
  permission: NotificationPermission | "unsupported";
  showDialog: boolean;
  isResubscribe: boolean; // 재구독 여부 구분
}

export function useNotificationPermission() {
  const { state: authState } = useAuth();
  const user = authState.status === "authenticated" ? authState.user : null;
  const userId =
    authState.status === "authenticated" ? authState.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  const createSubscriptionMutation = useCreateSubscriptionMutation();

  // 토스트 대신 메시지 상태만 반환
  const [lastMessage, setLastMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [state, setState] = useState<NotificationPermissionState>({
    hasAsked: false,
    permission: "default" as NotificationPermission | "unsupported",
    showDialog: false,
    isResubscribe: false,
  });

  const {
    vapidKey,
    isLoading: vapidKeyLoading,
    error: vapidKeyError,
  } = useVapidKeyEffective();

  // 로컬스토리지 키 (통합)
  const getPromptStorageKey = (userId: string) =>
    `notification_prompt_${userId}`;

  // 브라우저 구독 상태 확인
  const checkBrowserSubscription = async (): Promise<boolean> => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      devLog.error("브라우저 구독 상태 확인 실패:", error);
      return false;
    }
  };

  // 로그인 후 알림 권한 상태 확인
  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    const checkNotificationPermission = async () => {
      const promptStorageKey = getPromptStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      const safeNotification = safeNotificationAccess();
      const lastPrompted = safeLocalStorage.getItem(promptStorageKey);
      const currentPermission = safeNotification.permission;
      const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
      const canReAsk =
        !lastPrompted || parseInt(lastPrompted) < Date.now() - FOURTEEN_DAYS;

      // 브라우저에서 알림을 지원하지 않는 경우
      if (!safeNotification.isSupported) {
        setState({
          hasAsked: true,
          permission: "denied",
          showDialog: false,
          isResubscribe: false,
        });
        return;
      }

      // 권한이 이미 허용된 경우
      if (currentPermission === "granted") {
        // 브라우저 구독 상태 확인
        const hasSubscription = await checkBrowserSubscription();

        if (hasSubscription) {
          // 구독도 있고 권한도 있음 - 정상 상태
          setState({
            hasAsked: true,
            permission: currentPermission,
            showDialog: false,
            isResubscribe: false,
          });
          return;
        } else {
          // 권한은 있지만 구독이 없음 - 재구독 필요
          if (canReAsk) {
            timeoutId = setTimeout(async () => {
              const hasSubscriptionNow = await checkBrowserSubscription();
              if (hasSubscriptionNow) {
                setState({
                  hasAsked: true,
                  permission: currentPermission,
                  showDialog: false,
                  isResubscribe: false,
                });
                return;
              }
              setState((prev) => {
                if (prev.showDialog) {
                  return prev;
                }
                return {
                  ...prev,
                  hasAsked: false,
                  permission: currentPermission as
                    | NotificationPermission
                    | "unsupported",
                  showDialog: true,
                  isResubscribe: true,
                };
              });
            }, 6000);
          } else {
            setState({
              hasAsked: true,
              permission: currentPermission,
              showDialog: false,
              isResubscribe: false,
            });
          }
          return;
        }
      }

      // 권한이 거부된 경우 - 더 이상 요청하지 않음 (브라우저에서 재설정 필요)
      if (currentPermission === "denied") {
        setState({
          hasAsked: true,
          permission: currentPermission,
          showDialog: false,
          isResubscribe: false,
        });
        return;
      }

      // 권한이 default인 경우 - 14일 간격으로 재요청
      if (currentPermission === "default") {
        if (canReAsk) {
          timeoutId = setTimeout(() => {
            setState((prev) => {
              if (prev.showDialog) {
                return prev;
              }
              return {
                ...prev,
                hasAsked: false,
                permission: currentPermission as
                  | NotificationPermission
                  | "unsupported",
                showDialog: true,
                isResubscribe: false,
              };
            });
          }, 2000);
        } else {
          setState({
            hasAsked: true,
            permission: currentPermission,
            showDialog: false,
            isResubscribe: false,
          });
        }
      }
    };

    checkNotificationPermission();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, profile?.id]);

  // 알림 허용 처리 - 공통 로직 사용
  const handleAllow = async () => {
    if (!user) return;

    if (state.hasAsked && !state.isResubscribe) {
      return;
    }

    try {
      // VAPID 키 사용 (최상위에서 받은 값)
      if (!vapidKey) {
        setLastMessage({
          type: "error",
          title: "VAPID 키 오류",
          message: "VAPID 키를 가져올 수 없습니다. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }

      const result = await requestNotificationPermissionAndSubscribe(
        async () => vapidKey,
        async (subscription, deviceId, options) => {
          return await createSubscriptionMutation.mutateAsync({
            subscription,
            deviceId,
            options: {
              ...options,
              isResubscribe: state.isResubscribe,
              updateSettings: true,
            },
          });
        }
      );

      if (result.success) {
        const messageText = state.isResubscribe
          ? "알림 구독이 다시 설정되었습니다."
          : "중요한 농장 관리 알림을 받으실 수 있습니다.";

        setLastMessage({
          type: "success",
          title: state.isResubscribe ? "알림 재구독 완료" : "알림 허용됨",
          message: result.message || messageText,
        });
      } else {
        const messageType =
          result.error === "PERMISSION_DENIED" ? "info" : "error";
        setLastMessage({
          type: messageType as "success" | "error" | "info",
          title:
            result.error === "PERMISSION_DENIED"
              ? "브라우저 설정 필요"
              : "오류 발생",
          message: result.message || "알림 설정 중 오류가 발생했습니다.",
        });
      }

      // 상태 업데이트 및 로컬스토리지에 타임스탬프 기록 (통합)
      const promptStorageKey = getPromptStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      safeLocalStorage.setItem(promptStorageKey, Date.now().toString());

      setState((prev) => ({
        ...prev,
        hasAsked: true,
        permission: result.success ? "granted" : "denied",
        showDialog: false,
        isResubscribe: false,
      }));
    } catch (error) {
      setLastMessage({
        type: "error",
        title: "오류 발생",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  };

  // 알림 거부 처리
  const handleDeny = () => {
    if (!user) return;

    if (state.hasAsked && !state.isResubscribe) {
      return;
    }

    const promptStorageKey = getPromptStorageKey(user.id);
    const safeLocalStorage = safeLocalStorageAccess();
    safeLocalStorage.setItem(promptStorageKey, Date.now().toString());

    setState((prev) => ({
      ...prev,
      hasAsked: true,
      showDialog: false,
      isResubscribe: false,
    }));

    const messageText = state.isResubscribe
      ? "알림 재구독을 건너뛰었습니다. 설정 페이지에서 언제든지 다시 구독할 수 있습니다."
      : "언제든지 설정 페이지에서 알림을 활성화할 수 있습니다.";

    setLastMessage({
      type: "success",
      title: "알림 설정 건너뜀",
      message: messageText,
    });
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    setState((prev) => ({
      ...prev,
      showDialog: false,
    }));
  };

  return {
    showDialog: state.showDialog,
    permission: state.permission,
    hasAsked: state.hasAsked,
    isResubscribe: state.isResubscribe,
    handleAllow,
    handleDeny,
    closeDialog,
    lastMessage,
    clearLastMessage: () => setLastMessage(null),
  };
}
