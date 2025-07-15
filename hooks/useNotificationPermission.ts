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
import {
  requestNotificationPermissionAndSubscribe,
  checkPushSupport,
} from "@/lib/utils/notification/push-subscription";

interface NotificationPermissionState {
  hasAsked: boolean;
  permission: NotificationPermission | "unsupported";
  showDialog: boolean;
}

export function useNotificationPermission() {
  const { state: authState } = useAuth();

  // React Query hooks - 항상 활성화
  const { data: vapidData } = useVapidKeyQuery({
    enabled: true,
  });
  const createSubscriptionMutation = useCreateSubscriptionMutation();

  // 토스트 대신 메시지 상태만 반환
  const [lastMessage, setLastMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const user = authState.status === "authenticated" ? authState.user : null;
  const profile =
    authState.status === "authenticated" ? authState.profile : null;
  const [state, setState] = useState<NotificationPermissionState>({
    hasAsked: false,
    permission: "default" as NotificationPermission | "unsupported",
    showDialog: false,
  });

  // 로컬스토리지 키
  const getStorageKey = (userId: string) => `notification_permission_${userId}`;

  // 로그인 후 알림 권한 상태 확인
  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    const checkNotificationPermission = () => {
      const storageKey = getStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      const safeNotification = safeNotificationAccess();
      const lastAsked = safeLocalStorage.getItem(storageKey);
      const currentPermission = safeNotification.permission;

      // 브라우저에서 알림을 지원하지 않는 경우
      if (!safeNotification.isSupported) {
        setState({
          hasAsked: true,
          permission: "denied",
          showDialog: false,
        });
        return;
      }

      // 권한이 이미 허용된 경우 - 더 이상 요청하지 않음
      if (currentPermission === "granted") {
        setState({
          hasAsked: true,
          permission: currentPermission,
          showDialog: false,
        });
        return;
      }

      // 권한이 거부된 경우 - 더 이상 요청하지 않음 (브라우저에서 재설정 필요)
      if (currentPermission === "denied") {
        setState({
          hasAsked: true,
          permission: currentPermission,
          showDialog: false,
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
              };
            });
          }, 2000);
        } else {
          // 아직 재요청 기간이 되지 않은 경우
          setState({
            hasAsked: true,
            permission: currentPermission,
            showDialog: false,
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

    // 중복 실행 방지
    if (state.hasAsked) {
      console.log("🚫 알림 권한 이미 처리됨 - 중복 실행 방지");
      return;
    }

    try {
      // 공통 로직 사용
      const result = await requestNotificationPermissionAndSubscribe(
        async () => vapidData, // VAPID 키 가져오기
        async (subscription) => {
          // 서버에 구독 정보 전송
          return await createSubscriptionMutation.mutateAsync({
            subscription,
          });
        }
      );

      // 결과에 따른 메시지 설정
      if (result.success) {
        setLastMessage({
          type: "success",
          title: "알림 허용됨",
          message:
            result.message || "중요한 농장 관리 알림을 받으실 수 있습니다.",
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
      const storageKey = getStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      safeLocalStorage.setItem(storageKey, Date.now().toString());

      setState((prev) => ({
        ...prev,
        hasAsked: true,
        permission: result.success ? "granted" : "denied",
        showDialog: false,
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

    // 중복 실행 방지
    if (state.hasAsked) {
      console.log("🚫 알림 권한 이미 처리됨 - 중복 실행 방지");
      return;
    }

    console.log("✅ 알림 권한 거부 처리 시작");
    const storageKey = getStorageKey(user.id);
    const safeLocalStorage = safeLocalStorageAccess();
    safeLocalStorage.setItem(storageKey, Date.now().toString());

    setState((prev) => ({
      ...prev,
      hasAsked: true,
      showDialog: false,
    }));

    setLastMessage({
      type: "success",
      title: "알림 설정 건너뜀",
      message: "언제든지 설정 페이지에서 알림을 활성화할 수 있습니다.",
    });
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    setState((prev) => ({
      ...prev,
      showDialog: false,
    }));
  };

  // 강제로 다이얼로그 표시 (디버깅/테스트용)
  const showDialogForce = () => {
    setState((prev) => ({
      ...prev,
      showDialog: true,
    }));
  };

  // 로컬스토리지 초기화 (테스트용)
  const resetPermissionState = () => {
    if (!user) return;

    const storageKey = getStorageKey(user.id);
    const safeLocalStorage = safeLocalStorageAccess();
    const safeNotification = safeNotificationAccess();
    safeLocalStorage.removeItem(storageKey);

    setState({
      hasAsked: false,
      permission: safeNotification.permission as
        | NotificationPermission
        | "unsupported",
      showDialog: true,
    });

    devLog.log("알림 권한 상태가 초기화되었습니다.");
  };

  // 디버깅 정보 출력
  const getDebugInfo = () => {
    if (!user) return null;

    const storageKey = getStorageKey(user.id);
    const safeLocalStorage = safeLocalStorageAccess();
    const safeNotification = safeNotificationAccess();
    const lastAsked = safeLocalStorage.getItem(storageKey);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const canReAsk = !lastAsked || parseInt(lastAsked) < sevenDaysAgo;

    const supportCheck = checkPushSupport();

    return {
      userId: user.id,
      storageKey,
      lastAsked: lastAsked
        ? new Date(parseInt(lastAsked)).toLocaleString()
        : "없음",
      canReAsk,
      daysUntilReAsk: lastAsked
        ? Math.ceil(
            (parseInt(lastAsked) + 7 * 24 * 60 * 60 * 1000 - Date.now()) /
              (24 * 60 * 60 * 1000)
          )
        : 0,
      currentPermission: safeNotification.permission,
      notificationSupported: safeNotification.isSupported,
      serviceWorkerSupported: "serviceWorker" in navigator,
      pushManagerSupported: "PushManager" in window,
      // PWA 관련 정보 추가
      isPWA: supportCheck.details.isPWA,
      displayMode: supportCheck.details.displayMode,
      iosVersion: supportCheck.details.iosVersion,
      pushSupported: supportCheck.supported,
      state: state,
    };
  };

  return {
    showDialog: state.showDialog,
    permission: state.permission,
    hasAsked: state.hasAsked,
    handleAllow,
    handleDeny,
    closeDialog,
    lastMessage,
    clearLastMessage: () => setLastMessage(null),
    // 디버깅/테스트용 함수들
    showDialogForce,
    resetPermissionState,
    getDebugInfo,
  };
}
