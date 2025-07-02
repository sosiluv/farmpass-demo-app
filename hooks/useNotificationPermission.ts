"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface NotificationPermissionState {
  hasAsked: boolean;
  permission: NotificationPermission;
  showDialog: boolean;
}

export function useNotificationPermission() {
  const { state: authState } = useAuth();
  const toast = useCommonToast();

  const user = authState.status === "authenticated" ? authState.user : null;
  const profile =
    authState.status === "authenticated" ? authState.profile : null;
  const [state, setState] = useState<NotificationPermissionState>({
    hasAsked: false,
    permission: "default",
    showDialog: false,
  });

  // 로컬스토리지 키
  const getStorageKey = (userId: string) => `notification_permission_${userId}`;

  // 로그인 후 알림 권한 상태 확인
  useEffect(() => {
    if (!user || !profile) return;

    const checkNotificationPermission = () => {
      const storageKey = getStorageKey(user.id);
      const hasAskedBefore = localStorage.getItem(storageKey) === "true";
      const currentPermission = Notification.permission;

      // 브라우저에서 알림을 지원하지 않는 경우
      if (!("Notification" in window)) {
        setState({
          hasAsked: true,
          permission: "denied",
          showDialog: false,
        });
        return;
      }

      // 이미 물어봤거나 권한이 설정된 경우
      if (hasAskedBefore || currentPermission !== "default") {
        setState({
          hasAsked: true,
          permission: currentPermission,
          showDialog: false,
        });
        return;
      }

      // 처음 로그인하는 사용자에게 알림 동의 창 표시
      // 로그인 후 2초 후에 표시 (사용자 경험 개선)
      const timer = setTimeout(() => {
        setState({
          hasAsked: false,
          permission: currentPermission,
          showDialog: true,
        });
      }, 2000);

      return () => clearTimeout(timer);
    };

    checkNotificationPermission();
  }, [user, profile]);

  // 알림 허용 처리
  const handleAllow = async () => {
    if (!user) return;

    try {
      // 브라우저 알림 권한 요청
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // 웹푸시 구독 시작
        await initializePushSubscription();

        toast.showCustomSuccess(
          "알림 허용됨",
          "중요한 농장 관리 알림을 받으실 수 있습니다."
        );
      } else {
        toast.showCustomError(
          "알림 거부됨",
          "언제든지 설정에서 알림을 활성화할 수 있습니다."
        );
      }

      // 상태 업데이트 및 로컬스토리지에 기록
      const storageKey = getStorageKey(user.id);
      localStorage.setItem(storageKey, "true");

      setState((prev) => ({
        ...prev,
        hasAsked: true,
        permission,
        showDialog: false,
      }));
    } catch (error) {
      devLog.error("알림 권한 요청 실패:", error);
      toast.showCustomError("오류 발생", "알림 설정 중 오류가 발생했습니다.");
    }
  };

  // 알림 거부 처리
  const handleDeny = () => {
    if (!user) return;

    const storageKey = getStorageKey(user.id);
    localStorage.setItem(storageKey, "true");

    setState((prev) => ({
      ...prev,
      hasAsked: true,
      showDialog: false,
    }));

    toast.showCustomSuccess(
      "알림 설정 건너뜀",
      "언제든지 설정 페이지에서 알림을 활성화할 수 있습니다."
    );
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

      // VAPID 키 가져오기
      const vapidResponse = await fetch("/api/push/vapid");
      if (!vapidResponse.ok) {
        devLog.warn("VAPID 키를 가져올 수 없습니다.");
        return;
      }

      const { publicKey } = await vapidResponse.json();
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

      // 서버에 구독 정보 전송 (전체 구독)
      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          // farmId 없음 = 전체 구독
        }),
      });

      if (response.ok) {
        devLog.log("웹푸시 구독이 성공적으로 등록되었습니다.");
      }
    } catch (error) {
      devLog.error("웹푸시 구독 초기화 실패:", error);
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
    setState((prev) => ({
      ...prev,
      showDialog: true,
    }));
  };

  // 로컬스토리지 초기화 (테스트용)
  const resetPermissionState = () => {
    if (!user) return;

    const storageKey = getStorageKey(user.id);
    localStorage.removeItem(storageKey);

    setState({
      hasAsked: false,
      permission: Notification.permission,
      showDialog: true,
    });

    devLog.log("알림 권한 상태가 초기화되었습니다.");
  };

  // 디버깅 정보 출력
  const getDebugInfo = () => {
    if (!user) return null;

    const storageKey = getStorageKey(user.id);
    const hasAskedBefore = localStorage.getItem(storageKey) === "true";

    return {
      userId: user.id,
      storageKey,
      hasAskedBefore,
      currentPermission: Notification.permission,
      notificationSupported: "Notification" in window,
      serviceWorkerSupported: "serviceWorker" in navigator,
      pushManagerSupported: "PushManager" in window,
      state: state,
    };
  };

  /**
   * 브라우저 푸시 알림 지원 여부를 엄격하게 검사
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
    };
  } {
    const details = {
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
      notification: "Notification" in window,
      permissions: "permissions" in navigator,
      userAgent: navigator.userAgent,
    };

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
    // 디버깅/테스트용 함수들
    showDialogForce,
    resetPermissionState,
    getDebugInfo,
  };
}
