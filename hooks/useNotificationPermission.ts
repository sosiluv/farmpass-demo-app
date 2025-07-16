"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getNotificationErrorMessage } from "@/lib/utils/validation/validation";
import {
  safeLocalStorageAccess,
  safeNotificationAccess,
} from "@/lib/utils/browser/safari-compat";
import {
  useVapidKeyQuery,
  useCreateSubscriptionMutation,
} from "@/lib/hooks/query/use-push-mutations";
import { requestNotificationPermissionAndSubscribe } from "@/lib/utils/notification/push-subscription";

interface NotificationPermissionState {
  hasAsked: boolean;
  permission: NotificationPermission | "unsupported";
  showDialog: boolean;
  isResubscribe: boolean; // 재구독 여부 구분
}

export function useNotificationPermission() {
  const { state: authState } = useAuth();

  // 사용자 정보 추출
  const user = authState.status === "authenticated" ? authState.user : null;
  const profile =
    authState.status === "authenticated" ? authState.profile : null;

  // React Query hooks - 필요할 때만 로드 (Lazy Loading)
  const { data: vapidData, refetch: refetchVapidKey } = useVapidKeyQuery({
    enabled: false, // 처음엔 로드하지 않음
  });
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

  // 로컬스토리지 키
  const getStorageKey = (userId: string) => `notification_permission_${userId}`;
  const getResubscribeStorageKey = (userId: string) =>
    `notification_resubscribe_${userId}`;

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
      const storageKey = getStorageKey(user.id);
      const resubscribeStorageKey = getResubscribeStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      const safeNotification = safeNotificationAccess();
      const lastAsked = safeLocalStorage.getItem(storageKey);
      const lastResubscribeAsked = safeLocalStorage.getItem(
        resubscribeStorageKey
      );
      const currentPermission = safeNotification.permission;

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
          const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
          const canReAsk =
            !lastResubscribeAsked ||
            parseInt(lastResubscribeAsked) < fourteenDaysAgo;

          if (canReAsk) {
            // 로그인 직후에는 구독 복구 시간을 더 길게 주고, 그래도 실패하면 표시
            timeoutId = setTimeout(async () => {
              // 한 번 더 브라우저 구독 상태 확인 (구독 복구 완료되었을 수도 있음)
              const hasSubscriptionNow = await checkBrowserSubscription();
              if (hasSubscriptionNow) {
                // 구독이 복구되었으면 다이얼로그 표시하지 않음
                setState({
                  hasAsked: true,
                  permission: currentPermission,
                  showDialog: false,
                  isResubscribe: false,
                });
                return;
              }

              // 여전히 구독이 없으면 재구독 다이얼로그 표시
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
            }, 6000); // 8초 후 재확인하여 불필요한 다이얼로그 방지
          } else {
            // 아직 재구독 요청 기간이 되지 않음
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

      // 권한이 default인 경우 - 7일 간격으로 재요청
      if (currentPermission === "default") {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const canReAsk = !lastAsked || parseInt(lastAsked) < sevenDaysAgo;

        if (canReAsk) {
          // 로그인 후 2초 후에 표시 (사용자 경험 개선)
          timeoutId = setTimeout(() => {
            setState((prev) => {
              // 이미 다이얼로그가 표시되고 있다면 상태 변경하지 않음
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
          // 아직 재요청 기간이 되지 않은 경우
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

    // cleanup 함수
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, profile?.id]); // showDialog 제거 - 무한 렌더링 방지

  // 알림 허용 처리 - 공통 로직 사용
  const handleAllow = async () => {
    if (!user) return;

    // 중복 실행 방지 (재구독일 때는 제외)
    if (state.hasAsked && !state.isResubscribe) {
      console.log("🚫 알림 권한 이미 처리됨 - 중복 실행 방지");
      return;
    }

    try {
      // VAPID 키 lazy loading - 필요할 때만 로드
      let key = vapidData;
      if (!key) {
        const { data: newKey } = await refetchVapidKey();
        key = newKey;
      }

      if (!key) {
        setLastMessage({
          type: "error",
          title: "VAPID 키 오류",
          message: "VAPID 키를 가져올 수 없습니다. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }

      // 공통 로직 사용
      const result = await requestNotificationPermissionAndSubscribe(
        async () => key, // 확보된 VAPID 키 사용
        async (subscription) => {
          // 서버에 구독 정보 전송
          return await createSubscriptionMutation.mutateAsync({
            subscription,
          });
        }
      );

      // 결과에 따른 메시지 설정
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

      // 상태 업데이트 및 로컬스토리지에 타임스탬프 기록
      const storageKey = state.isResubscribe
        ? getResubscribeStorageKey(user.id)
        : getStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      safeLocalStorage.setItem(storageKey, Date.now().toString());

      setState((prev) => ({
        ...prev,
        hasAsked: true,
        permission: result.success ? "granted" : "denied",
        showDialog: false,
        isResubscribe: false,
      }));
    } catch (error) {
      const notificationError = getNotificationErrorMessage(error);
      setLastMessage({
        type: "error",
        title: "오류 발생",
        message: notificationError.message,
      });
    }
  };

  // 알림 거부 처리
  const handleDeny = () => {
    if (!user) return;

    // 중복 실행 방지 (재구독일 때는 제외)
    if (state.hasAsked && !state.isResubscribe) {
      console.log("🚫 알림 권한 이미 처리됨 - 중복 실행 방지");
      return;
    }

    console.log("✅ 알림 권한 거부 처리 시작");
    const storageKey = state.isResubscribe
      ? getResubscribeStorageKey(user.id)
      : getStorageKey(user.id);
    const safeLocalStorage = safeLocalStorageAccess();
    safeLocalStorage.setItem(storageKey, Date.now().toString());

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
