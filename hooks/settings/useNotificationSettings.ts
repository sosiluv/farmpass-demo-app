import { useCallback } from "react";
import type { SystemSettings } from "@/lib/types/settings";
import { useNotificationMutations } from "@/lib/hooks/query/use-notification-mutations";

// 시스템 설정용 알림 설정 훅 (시스템 관리자용)
export function useSystemNotificationSettings(options: {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
  handleImageUpload?: (
    file: File,
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
  handleImageDelete?: (
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
}) {
  const { onUpdate } = options;

  // VAPID 키 생성
  const notificationMutations = useNotificationMutations();

  const handleGenerateVapidKeys = useCallback(async () => {
    try {
      const data = await notificationMutations.generateVapidKeysAsync();

      onUpdate("vapidPublicKey", data.publicKey);
      onUpdate("vapidPrivateKey", data.privateKey);

      // API 응답 반환 (message, warning 포함)
      return {
        publicKey: data.publicKey,
        privateKey: data.privateKey,
        message: data.message,
        warning: data.warning,
        success: data.success,
      };
    } catch (error) {
      // 에러는 이미 mutation에서 처리됨
      throw error;
    }
  }, [onUpdate, notificationMutations]);

  return {
    handleGenerateVapidKeys,
  };
}
