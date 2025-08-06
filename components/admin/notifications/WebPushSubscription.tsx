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
import { useNotificationService } from "@/hooks/notification/useNotificationService";
import { renderNotificationStatus } from "./status/NotificationStatus";
import NotificationCardHeader from "./NotificationCardHeader";
import { Zap } from "lucide-react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { safeNotificationAccess } from "@/lib/utils/browser/safari-compat";
import { PAGE_HEADER } from "@/lib/constants/notifications";

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
  } = useNotificationService(); // Lazy Loading으로 최적화
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
      // 기존 서비스 워커 확인
      let registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        // 기존 서비스 워커가 없으면 새로 등록
        registration = await navigator.serviceWorker.register("/push-sw.js");
      }

      await checkNotificationStatus();
    } catch (error) {
      devLog.error("❌ [DEBUG] 서비스 워커 초기화 실패:", error);
      setStatus("unsupported");
    }
  };

  const checkNotificationStatus = async () => {
    const safeNotification = safeNotificationAccess();

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

        // 브라우저의 실제 구독 상태를 우선적으로 확인
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
          // 브라우저에 구독이 없어도 서버 상태 확인
          try {
            const { subscriptions } = await getSubscriptionStatus();

            if (subscriptions && subscriptions.length > 0) {
              // 서버에 구독이 있으면 subscribed 상태로 설정 (새 구독 생성 방지)

              // 브라우저에 구독이 없으면 복구 시도
              if (!subscription) {
                try {
                  // 서버 구독이 있으면 브라우저 구독을 새로 생성

                  await requestNotificationPermission();
                } catch (error) {
                  devLog.warn("⚠️ [DEBUG] 브라우저 구독 복구 실패:", error);
                }
              }

              // 복구 성공 여부와 관계없이 subscribed 상태로 설정
              setStatus("subscribed");
              const subscribedFarms = (subscriptions || [])
                .map((sub: any) => sub.farm)
                .filter(Boolean);

              setFarms((prevFarms) =>
                (prevFarms || []).map((farm) => ({
                  ...farm,
                  isSubscribed: subscribedFarms.some(
                    (subFarm: { id: string }) => subFarm.id === farm.id
                  ),
                }))
              );
            } else {
              // 서버에도 구독이 없으면 granted 상태
              devLog.log("❌ [DEBUG] 서버에도 구독 없음 - granted 상태 설정");
              setStatus("granted");
              setFarms((prevFarms) =>
                (prevFarms || []).map((farm) => ({
                  ...farm,
                  isSubscribed: false,
                }))
              );
            }
          } catch (error) {
            // 에러 발생 시 기본적으로 granted 상태
            devLog.error("❌ [DEBUG] 서버 구독 조회 실패:", error);
            setStatus("granted");
            setFarms((prevFarms) =>
              (prevFarms || []).map((farm) => ({
                ...farm,
                isSubscribed: false,
              }))
            );
          }
        }
        break;
      default:
        devLog.log("❓ [DEBUG] 기본 권한 상태:", safeNotification.permission);
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("구독 해제 실패", errorMessage);
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
        title={PAGE_HEADER.PUSH_NOTIFICATION_SETTINGS}
        description={PAGE_HEADER.PUSH_DESCRIPTION}
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
