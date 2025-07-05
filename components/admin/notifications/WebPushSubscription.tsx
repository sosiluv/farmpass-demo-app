"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { devLog } from "@/lib/utils/logging/dev-logger";

import type { SubscriptionStatus, Farm } from "@/lib/types/notification";
import { useNotificationService } from "@/hooks/useNotificationService";
import { renderNotificationStatus } from "./status/NotificationStatus";
import NotificationCardHeader from "./NotificationCardHeader";
import { Zap } from "lucide-react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

interface WebPushSubscriptionProps {
  farms?: Farm[];
  onSubscriptionStatusChange?: (isSubscribed: boolean) => void;
}

export function WebPushSubscription({
  farms: propFarms = [],
  onSubscriptionStatusChange,
}: WebPushSubscriptionProps) {
  const [status, setStatus] = useState<SubscriptionStatus>("checking");
  const [farms, setFarms] = useState<Farm[]>([]);
  const {
    isLoading,
    requestNotificationPermission,
    sendTestNotification,
    cleanupSubscriptions,
    handleUnsubscription,
    getSubscriptionStatus,
    lastMessage,
    clearLastMessage,
  } = useNotificationService();
  const toast = useCommonToast();

  // props로 받은 농장 데이터 처리
  useEffect(() => {
    setFarms(
      propFarms.map((farm) => ({
        ...farm,
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
        toast.showCustomSuccess(lastMessage.title, lastMessage.message);
      } else {
        toast.showCustomError(lastMessage.title, lastMessage.message);
      }
      clearLastMessage();
    }
  }, [lastMessage, toast, clearLastMessage]);

  const initializeNotifications = async () => {
    try {
      // Service Worker 지원 여부 확인
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.showWarning(
          "브라우저 미지원",
          "이 브라우저는 푸시 알림을 지원하지 않습니다."
        );
        setStatus("unsupported");
        return;
      }

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
    devLog.log("알림 상태 확인 시작");
    devLog.log("현재 권한 상태:", Notification.permission);

    // 브라우저 지원 여부 확인
    if (!("Notification" in window)) {
      devLog.log("브라우저에서 알림 미지원");
      setStatus("unsupported");
      return;
    }

    // 권한 상태 확인
    switch (Notification.permission) {
      case "denied":
        devLog.log("알림 권한 거부됨");
        setStatus("denied");
        break;
      case "granted":
        devLog.log("알림 권한 허용됨, 구독 상태 확인");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          devLog.log("기존 구독 발견");
          setStatus("subscribed");
          // 구독된 농장 정보 로드
          const { subscriptions } = await getSubscriptionStatus();
          if (subscriptions?.length > 0) {
            devLog.log("구독된 농장 정보:", subscriptions);
            const subscribedFarms = subscriptions
              .map((sub: any) => sub.farm)
              .filter(Boolean);

            // 기존 farms 상태와 구독 정보를 병합
            setFarms((prevFarms) =>
              prevFarms.map((farm) => ({
                ...farm,
                isSubscribed: subscribedFarms.some(
                  (subFarm: { id: string }) => subFarm.id === farm.id
                ),
              }))
            );
          }
        } else {
          devLog.log("구독 없음, granted 상태로 설정");
          setStatus("granted");
        }
        break;
      default:
        devLog.log("알림 권한 미설정");
        setStatus("granted");
    }
  };

  const handleAllow = async () => {
    toast.showInfo("알림 권한 요청", "알림 권한을 요청하는 중입니다...");
    const success = await requestNotificationPermission();
    if (success) {
      await checkNotificationStatus();
    }
  };

  const handleUnsubscribe = async () => {
    toast.showInfo("구독 해제 시작", "푸시 구독을 해제하는 중입니다...");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await handleUnsubscription(subscription);
        setStatus("granted");
        setFarms((prevFarms) =>
          prevFarms.map((farm) => ({
            ...farm,
            isSubscribed: false,
          }))
        );
      }
    } catch (error) {
      devLog.error("구독 해제 실패:", error);
    }
  };

  const handleTest = () => {
    sendTestNotification();
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
          onTest: handleTest,
          onCleanup: handleCleanup,
          onUnsubscribe: handleUnsubscribe,
          farms,
        })}
      </CardContent>
    </Card>
  );
}
