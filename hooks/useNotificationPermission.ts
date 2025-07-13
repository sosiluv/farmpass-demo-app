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
import { getDeviceInfo } from "@/lib/utils/browser/device-detection";
import { handleError } from "@/lib/utils/error/handleError";

interface NotificationPermissionState {
  hasAsked: boolean;
  permission: NotificationPermission | "unsupported";
  showDialog: boolean;
}

export function useNotificationPermission() {
  const { state: authState } = useAuth();
  const [needsVapidKey, setNeedsVapidKey] = useState(false);

  // React Query hooks - 처음에는 비활성화
  const { data: vapidData } = useVapidKeyQuery({
    enabled: needsVapidKey,
  });
  const createSubscriptionMutation = useCreateSubscriptionMutation();

  // 토스트 대신 메시지 상태만 반환
  const [lastMessage, setLastMessage] = useState<{
    type: "success" | "error";
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
    if (!user || !profile) return;

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

      // 권한이 거부되었거나 default인 경우 - 7일 간격으로 재요청
      if (currentPermission === "denied" || currentPermission === "default") {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const canReAsk = !lastAsked || parseInt(lastAsked) < sevenDaysAgo;

        if (canReAsk) {
          // 로그인 후 2초 후에 표시 (사용자 경험 개선)
          timeoutId = setTimeout(() => {
            setState((prev) => {
              // 이미 다이얼로그가 표시되고 있다면 상태 변경하지 않음
              if (prev.showDialog) {
                console.log("🚫 알림 다이얼로그 이미 표시 중 - 중복 방지");
                return prev;
              }
              console.log("✅ 알림 다이얼로그 표시 요청");
              return {
                ...prev,
                hasAsked: false,
                permission: currentPermission,
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
  }, [user?.id, profile?.id]); // user와 profile 객체 전체가 아닌 id만 의존성으로

  // 알림 허용 처리
  const handleAllow = async () => {
    if (!user) return;

    // 중복 실행 방지
    if (state.hasAsked) {
      console.log("🚫 알림 권한 이미 처리됨 - 중복 실행 방지");
      return;
    }

    try {
      // VAPID key가 필요한 시점에서 조회 시작
      setNeedsVapidKey(true);

      // 브라우저 알림 권한 요청 (Safari 호환성 고려)
      const safeNotification = safeNotificationAccess();
      const permission = await safeNotification.requestPermission();

      if (permission === "granted") {
        // 웹푸시 구독 시작
        await initializePushSubscription();

        setLastMessage({
          type: "success",
          title: "알림 허용됨",
          message: "중요한 농장 관리 알림을 받으실 수 있습니다.",
        });
      } else if (permission === "unsupported") {
        setLastMessage({
          type: "error",
          title: "알림 미지원",
          message: "현재 브라우저에서는 알림 기능을 지원하지 않습니다.",
        });
      } else {
        setLastMessage({
          type: "error",
          title: "알림 거부됨",
          message: "언제든지 설정에서 알림을 활성화할 수 있습니다.",
        });
      }

      // 상태 업데이트 및 로컬스토리지에 타임스탬프 기록
      const storageKey = getStorageKey(user.id);
      const safeLocalStorage = safeLocalStorageAccess();
      safeLocalStorage.setItem(storageKey, Date.now().toString());

      setState((prev) => ({
        ...prev,
        hasAsked: true,
        permission,
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

  // 웹푸시 구독 초기화
  const initializePushSubscription = async () => {
    try {
      // 강화된 브라우저 지원 확인
      const supportCheck = checkPushSupport();
      if (!supportCheck.supported) {
        devLog.warn(
          "웹푸시를 지원하지 않는 브라우저입니다.",
          supportCheck.details
        );
        return;
      }

      // VAPID 키 가져오기 (React Query 사용)
      const publicKey = vapidData?.publicKey;
      if (!publicKey) {
        devLog.warn("VAPID 공개 키가 설정되지 않았습니다.");
        return;
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.register(
        "/push-sw.js"
      );
      await navigator.serviceWorker.ready;

      // 푸시 구독 생성
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 서버에 구독 정보 전송 (React Query Mutation 사용)
      const result = await createSubscriptionMutation.mutateAsync({
        subscription: subscription.toJSON(),
        // farmId 없음 = 전체 구독
      });

      devLog.log("웹푸시 구독이 성공적으로 등록되었습니다.");

      // API 응답 메시지를 사용하여 성공 메시지 업데이트
      if (result?.message) {
        setLastMessage({
          type: "success",
          title: "알림 허용됨",
          message: result.message,
        });
      }
    } catch (error) {
      handleError(error, { context: "initializePushSubscription" });
    }
  };

  // VAPID 키 변환 유틸리티
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

  // 다이얼로그 닫기
  const closeDialog = () => {
    setState((prev) => ({
      ...prev,
      showDialog: false,
    }));
  };

  // 강제로 다이얼로그 표시 (디버깅/테스트용)
  const showDialogForce = () => {
    setNeedsVapidKey(true); // VAPID key 활성화
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

  /**
   * 브라우저 푸시 알림 지원 여부를 엄격하게 검사 (PWA 포함)
   * @returns 지원 여부와 상세 정보
   */
  function checkPushSupport(): {
    supported: boolean;
    details: {
      serviceWorker: boolean;
      pushManager: boolean;
      notification: boolean;
      permissions: boolean;
      userAgent: string;
      isPWA: boolean;
      displayMode: string;
      iosVersion?: number;
    };
  } {
    const deviceInfo = getDeviceInfo();
    const userAgent = deviceInfo.userAgent;
    const isIOS = deviceInfo.os === "iOS";
    const isSafari = deviceInfo.browser === "Safari";

    // iOS Safari 버전 체크
    let iosVersion: number | undefined;
    if (isIOS && isSafari) {
      const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (match) {
        iosVersion = parseInt(match[1]) + parseInt(match[2]) / 10;
      }
    }

    // PWA 모드 체크
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const displayMode = isPWA ? "standalone" : "browser";

    const details = {
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
      notification: "Notification" in window,
      permissions: "permissions" in navigator,
      userAgent: userAgent,
      isPWA: isPWA,
      displayMode: displayMode,
      iosVersion: iosVersion,
    };

    // iOS Safari 16.4 미만은 웹푸시 미지원
    if (isIOS && isSafari && iosVersion && iosVersion < 16.4) {
      return {
        supported: false,
        details: {
          ...details,
        },
      };
    }

    const supported =
      details.serviceWorker &&
      details.pushManager &&
      details.notification &&
      details.permissions;

    return { supported, details };
  }

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
