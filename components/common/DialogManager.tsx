"use client";

import { useEffect } from "react";
import { useDialogQueue } from "@/store/use-dialog-queue";
import { NotificationPermissionDialog } from "@/components/admin/notifications";
import { InstallPrompt } from "./InstallPrompt";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { usePWAInstall } from "@/components/providers/pwa-provider";

export function DialogManager() {
  const { currentDialog, isVisible, removeDialog, addDialog } =
    useDialogQueue();

  const installInfo = usePWAInstall();
  const { showDialog, handleAllow, handleDeny, closeDialog } =
    useNotificationPermission();

  // 알림 권한 다이얼로그 관리
  useEffect(() => {
    if (showDialog) {
      addDialog({
        type: "notification",
        priority: 100, // 최고 우선순위
        data: { showDialog, handleAllow, handleDeny, closeDialog },
        isSystemDialog: true,
      });
    }
  }, [showDialog, addDialog, handleAllow, handleDeny, closeDialog]);

  // PWA 설치 프롬프트 관리
  useEffect(() => {
    if (installInfo.canInstall) {
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
    }
  }, [installInfo.canInstall, addDialog]);

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
