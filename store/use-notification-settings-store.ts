import { create } from "zustand";
import type { NotificationSettings } from "@/lib/types/notification";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface NotificationSettingsState {
  settings: NotificationSettings | null;
  unsavedSettings: NotificationSettings | null;
  isLoading: boolean;
  error: Error | null;
  setSettings: (settings: NotificationSettings) => void;
  updateUnsavedSettings: (key: keyof NotificationSettings, value: any) => void;
  hasUnsavedChanges: () => boolean;
  resetUnsavedChanges: () => void;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>(
  (set, get) => ({
    settings: null,
    unsavedSettings: null,
    isLoading: false,
    error: null,

    setSettings: (settings) => {
      devLog.info("알림 설정 업데이트:", settings);
      set({
        settings,
        unsavedSettings: { ...settings }, // 깊은 복사를 위해 spread 연산자 사용
      });
    },

    updateUnsavedSettings: (key, value) => {
      const { unsavedSettings } = get();
      if (!unsavedSettings) return;

      devLog.info(`알림 설정 임시 수정: ${key}`, value);
      set({
        unsavedSettings: {
          ...unsavedSettings,
          [key]: value,
        },
      });
    },

    hasUnsavedChanges: () => {
      const { settings, unsavedSettings } = get();
      if (!settings || !unsavedSettings) return false;

      // 비교할 필드 목록
      const fieldsToCompare = [
        "notification_method",
        "visitor_alerts",
        "notice_alerts",
        "emergency_alerts",
        "maintenance_alerts",
      ];

      // 지정된 필드만 비교
      const hasChanges = fieldsToCompare.some((field) => {
        const originalValue = settings[field as keyof NotificationSettings];
        const currentValue =
          unsavedSettings[field as keyof NotificationSettings];

        // 값이 다른 경우 로그 출력
        if (originalValue !== currentValue) {
          devLog.info(`필드 ${field} 변경 감지:`, {
            field,
            originalValue,
            currentValue,
            settingsType: typeof originalValue,
            unsavedSettingsType: typeof currentValue,
          });
          return true;
        }
        return false;
      });

      return hasChanges;
    },

    resetUnsavedChanges: () => {
      const { settings } = get();
      devLog.info("알림 설정 변경사항 초기화");
      set({ unsavedSettings: settings ? { ...settings } : null });
    },
  })
);
