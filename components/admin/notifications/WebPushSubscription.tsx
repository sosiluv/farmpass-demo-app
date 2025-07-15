"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { devLog } from "@/lib/utils/logging/dev-logger";

import type { SubscriptionStatus } from "@/lib/types/notification";
import type { Farm } from "@/lib/types";

// 알림 전용 확장 Farm 타입
interface NotificationFarm extends Pick<Farm, "id" | "farm_name"> {
  address?: string;
  isSubscribed?: boolean;
}
import { useNotificationService } from "@/hooks/useNotificationService";
import { renderNotificationStatus } from "./status/NotificationStatus";
import NotificationCardHeader from "./NotificationCardHeader";
import { Zap } from "lucide-react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { safeNotificationAccess } from "@/lib/utils/browser/safari-compat";
import { getNotificationErrorMessage } from "@/lib/utils/validation/validation";

interface WebPushSubscriptionProps {
  farms?: Farm[];
  onSubscriptionStatusChange?: (isSubscribed: boolean) => void;
}

export function WebPushSubscription({
  farms: propFarms = [],
  onSubscriptionStatusChange,
}: WebPushSubscriptionProps) {
  const [status, setStatus] = useState<SubscriptionStatus>("checking");
  const [farms, setFarms] = useState<NotificationFarm[]>([]);
  const {
    isLoading,
    requestNotificationPermission,
    cleanupSubscriptions,
    handleUnsubscription,
    getSubscriptionStatus,
    lastMessage,
    clearLastMessage,
  } = useNotificationService(true); // VAPID key 필요
  const { showInfo, showWarning, showSuccess, showError } = useCommonToast();

  // props로 받은 농장 데이터 처리
  useEffect(() => {
    setFarms(
      (propFarms || []).map((farm) => ({
        id: farm.id,
        farm_name: farm.farm_name,
        address: farm.farm_address,
        isSubscribed: false,
      }))
    );
  }, [propFarms]);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "success") {
        showSuccess(lastMessage.title, lastMessage.message);
      } else {
        showError(lastMessage.title, lastMessage.message);
      }
      clearLastMessage();
    }
  }, [lastMessage, clearLastMessage]); // 토스트 함수들을 의존성에서 제거

  const initializeNotifications = async () => {
    try {
      // Service Worker 등록
      try {
        const registration = await navigator.serviceWorker.register(
          "/push-sw.js"
        );
        devLog.log("Service Worker 등록 성공:", registration);
        await checkNotificationStatus();
      } catch (error) {
        devLog.error("Service Worker 등록 실패:", error);
        setStatus("unsupported");
      }
    } catch (error) {
      devLog.error("알림 초기화 실패:", error);
      setStatus("unsupported");
    }
  };

  const checkNotificationStatus = async () => {
    const safeNotification = safeNotificationAccess();
    devLog.log("현재 권한 상태:", safeNotification.permission);

    // 브라우저 지원 여부 확인
    if (!safeNotification.isSupported) {
      showWarning(
        "브라우저 미지원",
        "이 브라우저는 푸시 알림을 지원하지 않습니다."
      );
      setStatus("unsupported");
      return;
    }

    // 권한 상태 확인
    switch (safeNotification.permission) {
      case "denied":
        setStatus("denied");
        break;
      case "granted":
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setStatus("subscribed");
          // 구독된 농장 정보 로드
          const { subscriptions } = await getSubscriptionStatus();
          if (subscriptions?.length > 0) {
            const subscribedFarms = (subscriptions || [])
              .map((sub: any) => sub.farm)
              .filter(Boolean);

            // 기존 farms 상태와 구독 정보를 병합
            setFarms((prevFarms) =>
              (prevFarms || []).map((farm) => ({
                ...farm,
                isSubscribed: subscribedFarms.some(
                  (subFarm: { id: string }) => subFarm.id === farm.id
                ),
              }))
            );
          }
        } else {
          setStatus("granted");
        }
        break;
      default:
        setStatus("granted");
    }
  };

  const handleAllow = async () => {
    showInfo("알림 권한 요청", "알림 권한을 요청하는 중입니다...");
    const success = await requestNotificationPermission();
    if (success) {
      await checkNotificationStatus();
    }
  };

  const handleUnsubscribe = async () => {
    showInfo("구독 해제 시작", "푸시 구독을 해제하는 중입니다...");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await handleUnsubscription(subscription);
        setStatus("granted");
        setFarms((prevFarms) =>
          (prevFarms || []).map((farm) => ({
            ...farm,
            isSubscribed: false,
          }))
        );
      }
    } catch (error) {
      devLog.error("구독 해제 실패:", error);
      const notificationError = getNotificationErrorMessage(error);
      showError("구독 해제 실패", notificationError.message);
    }
  };

  const handleCleanup = async () => {
    await cleanupSubscriptions();
    await checkNotificationStatus();
  };

  // 구독 상태 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    const isSubscribed = status === "subscribed";
    onSubscriptionStatusChange?.(isSubscribed);
  }, [status, onSubscriptionStatusChange]);

  return (
    <Card>
      <NotificationCardHeader
        icon={Zap}
        title="푸시 알림 설정"
        description="실시간 알림을 받아보세요"
      />
      <CardContent className="pt-0">
        {renderNotificationStatus(status, {
          isLoading,
          onAllow: handleAllow,
          onCleanup: handleCleanup,
          onUnsubscribe: handleUnsubscribe,
          farms,
        })}
      </CardContent>
    </Card>
  );
}
