"use client";

import { useEffect } from "react";
import { useSheetQueue } from "@/store/use-sheet-queue";
import { NotificationPermissionSheet } from "@/components/admin/notifications";
import { InstallPrompt } from "./InstallGuide/InstallPrompt";
import { useNotificationPermission } from "@/hooks/notification/useNotificationPermission";
import { usePWAInstall } from "@/components/providers/pwa-provider";
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useNotificationStore } from "@/store/use-notification-store";

export function DialogManager() {
  const { currentSheet, isVisible, removeSheet, addSheet, queue } =
    useSheetQueue();

  const installInfo = usePWAInstall();

  // Zustand 스토어에서 직접 상태 가져오기
  const { showSheet, isResubscribe } = useNotificationStore();

  // useNotificationPermission에서 핸들러만 가져오기
  const { handleAllow, handleDeny, closeSheet } = useNotificationPermission();

  // 공통 스토어 사용
  const { updateSubscriptionStatus } = useNotificationStore();

  // 농장 데이터 가져오기
  const { farms } = useFarmsQuery();

  // 알림 권한 시트 관리
  useEffect(() => {
    if (showSheet) {
      // 강화된 중복 방지: 현재 시트와 큐에서 모두 확인
      const hasNotificationSheet =
        currentSheet?.type === "notification" ||
        queue.some((sheet) => sheet.type === "notification");

      if (!hasNotificationSheet) {
        addSheet({
          type: "notification",
          priority: 90, // 최고 우선순위
          data: {
            showSheet,
            handleAllow,
            handleDeny,
            closeSheet,
            farmCount: farms.length, // 실제 농장 수 사용
            isResubscribe, // 재구독 여부 전달
          },
          isSystemSheet: true,
        });
      }
    }
  }, [showSheet, addSheet, currentSheet, queue, farms.length, isResubscribe]); // isResubscribe 의존성 추가

  // PWA 설치 프롬프트 관리
  useEffect(() => {
    if (installInfo.canInstall) {
      // 강화된 중복 방지: 현재 시트와 큐에서 모두 확인
      const hasPWASheet =
        currentSheet?.type === "pwa-install" ||
        queue.some((sheet) => sheet.type === "pwa-install");

      if (!hasPWASheet) {
        // 15초 후 PWA 설치 프롬프트 추가
        const timer = setTimeout(() => {
          addSheet({
            type: "pwa-install",
            priority: 50, // 알림보다 낮은 우선순위
            data: { installInfo },
            isSystemSheet: true,
          });
        }, 10000);

        return () => clearTimeout(timer);
      } else {
      }
    }
  }, [installInfo.canInstall, addSheet, currentSheet, queue]); // queue도 의존성에 추가

  // 현재 시트 렌더링
  const renderCurrentSheet = () => {
    if (!currentSheet || !isVisible) return null;

    switch (currentSheet.type) {
      case "notification":
        return (
          <NotificationPermissionSheet
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                currentSheet.data.handleDeny();
                removeSheet(currentSheet.id);
              }
            }}
            onAllow={async () => {
              await currentSheet.data.handleAllow();
              // 공통 스토어 상태 업데이트
              updateSubscriptionStatus("subscribed", true);
              removeSheet(currentSheet.id);
            }}
            onDeny={() => {
              currentSheet.data.handleDeny();
              removeSheet(currentSheet.id);
            }}
            farmCount={currentSheet.data.farmCount}
            isResubscribe={currentSheet.data.isResubscribe} // 재구독 여부 전달
          />
        );

      case "pwa-install":
        return (
          <InstallPrompt
            delay={0}
            onDismiss={() => removeSheet(currentSheet.id)}
            onInstall={() => removeSheet(currentSheet.id)}
          />
        );

      default:
        return null;
    }
  };

  return renderCurrentSheet();
}
