"use client";

import { useEffect } from "react";
import { useDialogQueue } from "@/store/use-dialog-queue";
import { NotificationPermissionDialog } from "@/components/admin/notifications";
import { InstallPrompt } from "./InstallPrompt";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { usePWAInstall } from "@/components/providers/pwa-provider";

export function DialogManager() {
  const { currentDialog, isVisible, removeDialog, addDialog, queue } =
    useDialogQueue();

  const installInfo = usePWAInstall();
  const { showDialog, handleAllow, handleDeny, closeDialog } =
    useNotificationPermission();

  // 알림 권한 다이얼로그 관리
  useEffect(() => {
    if (showDialog) {
      // 강화된 중복 방지: 현재 다이얼로그와 큐에서 모두 확인
      const hasNotificationDialog =
        currentDialog?.type === "notification" ||
        queue.some((dialog) => dialog.type === "notification");

      if (!hasNotificationDialog) {
        console.log("✅ 알림 권한 다이얼로그 추가");
        addDialog({
          type: "notification",
          priority: 100, // 최고 우선순위
          data: {
            showDialog,
            handleAllow,
            handleDeny,
            closeDialog,
            farmCount: 0, // 기본값, 실제로는 농장 개수를 가져와야 함
          },
          isSystemDialog: true,
        });
      } else {
        console.log("🚫 알림 다이얼로그 중복 방지됨");
      }
    }
  }, [showDialog, addDialog, currentDialog, queue]); // queue도 의존성에 추가

  // PWA 설치 프롬프트 관리
  useEffect(() => {
    if (installInfo.canInstall) {
      // 강화된 중복 방지: 현재 다이얼로그와 큐에서 모두 확인
      const hasPWADialog =
        currentDialog?.type === "pwa-install" ||
        queue.some((dialog) => dialog.type === "pwa-install");

      if (!hasPWADialog) {
        console.log("✅ PWA 설치 다이얼로그 타이머 시작");
        // 15초 후 PWA 설치 프롬프트 추가
        const timer = setTimeout(() => {
          addDialog({
            type: "pwa-install",
            priority: 50, // 알림보다 낮은 우선순위
            data: { installInfo },
            isSystemDialog: true,
          });
        }, 10000);

        return () => clearTimeout(timer);
      } else {
        console.log("🚫 PWA 다이얼로그 중복 방지됨");
      }
    }
  }, [installInfo.canInstall, addDialog, currentDialog, queue]); // queue도 의존성에 추가

  // 현재 다이얼로그 렌더링
  const renderCurrentDialog = () => {
    if (!currentDialog || !isVisible) return null;

    switch (currentDialog.type) {
      case "notification":
        return (
          <NotificationPermissionDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                // X 버튼을 누를 때도 closeDialog 호출하여 훅의 상태 업데이트
                currentDialog.data.closeDialog();
                removeDialog(currentDialog.id);
              }
            }}
            onAllow={async () => {
              await currentDialog.data.handleAllow();
              removeDialog(currentDialog.id);
            }}
            onDeny={() => {
              currentDialog.data.handleDeny();
              removeDialog(currentDialog.id);
            }}
            farmCount={currentDialog.data.farmCount}
          />
        );

      case "pwa-install":
        return (
          <InstallPrompt
            delay={0} // 즉시 표시
            onDismiss={() => removeDialog(currentDialog.id)}
            onInstall={() => removeDialog(currentDialog.id)}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderCurrentDialog()}</>;
}
