import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationSettingsQuery } from "@/lib/hooks/query/use-notification-settings-query";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useNotificationMutations } from "@/lib/hooks/query/use-notification-mutations";
import { getNotificationErrorMessage } from "@/lib/utils/validation/validation";
import { Save, Loader2 } from "lucide-react";
import type { NotificationSettings } from "@/lib/types/notification";
import { BUTTONS, LABELS } from "@/lib/constants/notifications";

interface NotificationSettingsActionsProps {
  hasUnsavedChanges?: boolean;
  onSaveComplete?: () => void;
  currentSettings?: NotificationSettings | null;
}

export function NotificationSettingsActions({
  hasUnsavedChanges = false,
  onSaveComplete,
  currentSettings,
}: NotificationSettingsActionsProps) {
  const [saving, setSaving] = useState(false);
  const { data: settings } = useNotificationSettingsQuery();
  const { showInfo, showError, showSuccess } = useCommonToast();
  const { saveSettings } = useNotificationMutations();

  // 저장할 설정 결정 (currentSettings가 있으면 사용, 없으면 settings 사용)
  const settingsToSave = currentSettings || settings;

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!settingsToSave || saving) return;

    setSaving(true);
    showInfo("알림 설정 저장 시작", "알림 설정을 저장하는 중입니다...");

    try {
      const result = await saveSettings.mutateAsync(settingsToSave);
      showSuccess(
        "알림 설정 저장 완료",
        result.message || "알림 설정이 성공적으로 저장되었습니다."
      );

      // 저장 완료 후 상태 초기화
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("알림 설정 저장 오류:", error);
      const notificationError = getNotificationErrorMessage(error);
      showError("알림 설정 저장 실패", notificationError.message);
    } finally {
      setSaving(false);
    }
  }, [
    settingsToSave,
    saving,
    saveSettings,
    showInfo,
    showSuccess,
    showError,
    onSaveComplete,
  ]);

  // 버튼 비활성화 상태
  const isDisabled = useMemo(() => {
    return !settingsToSave || saving || !hasUnsavedChanges;
  }, [settingsToSave, saving, hasUnsavedChanges]);

  return (
    <div className="flex justify-end space-x-2">
      <Button
        onClick={handleSave}
        disabled={isDisabled}
        className="min-w-[100px]"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {BUTTONS.SAVING}
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {BUTTONS.SAVE_SETTINGS}
          </>
        )}
      </Button>
    </div>
  );
}
