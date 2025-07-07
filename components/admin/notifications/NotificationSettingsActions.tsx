import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useNotificationMutations } from "@/lib/hooks/query/use-notification-mutations";
import { Save, Loader2 } from "lucide-react";

export function NotificationSettingsActions() {
  const [justSaved, setJustSaved] = useState(false);

  const { unsavedSettings, hasUnsavedChanges, setSettings } =
    useNotificationSettingsStore();
  const { showInfo, showError, showSuccess } = useCommonToast();
  const notificationMutations = useNotificationMutations();

  useEffect(() => {
    if (hasUnsavedChanges() && justSaved) {
      setJustSaved(false);
    }
  }, [unsavedSettings, hasUnsavedChanges, justSaved]);

  const handleSave = async () => {
    if (!unsavedSettings) return;

    showInfo("알림 설정 저장 시작", "알림 설정을 저장하는 중입니다...");
    
    try {
      const savedSettings = await notificationMutations.saveSettingsAsync(unsavedSettings);

      setSettings(savedSettings);
      setJustSaved(true);
      showSuccess(
        "알림 설정 저장 완료",
        "알림 설정이 성공적으로 저장되었습니다."
      );
    } catch (error) {
      showError(
        "알림 설정 저장 실패",
        "알림 설정을 저장하는 중 오류가 발생했습니다"
      );
    }
  };

  const isDisabled = !hasUnsavedChanges() || notificationMutations.isLoading || justSaved;

  return (
    <div className="flex justify-end mt-6">
      <Button
        onClick={handleSave}
        disabled={isDisabled}
        className="flex items-center"
      >
        {notificationMutations.isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            저장 중...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            설정 저장
          </>
        )}
      </Button>
    </div>
  );
}
