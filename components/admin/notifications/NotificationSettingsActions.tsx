import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationSettingsQuery } from "@/lib/hooks/query/use-notification-settings-query";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useNotificationMutations } from "@/lib/hooks/query/use-notification-mutations";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { Save, Loader2 } from "lucide-react";

export function NotificationSettingsActions() {
  const [justSaved, setJustSaved] = useState(false);
  const { data: settings } = useNotificationSettingsQuery();
  const { showInfo, showError, showSuccess } = useCommonToast();
  const { saveSettings } = useNotificationMutations();

  const handleSave = async () => {
    if (!settings) return;

    showInfo("알림 설정 저장 시작", "알림 설정을 저장하는 중입니다...");

    try {
      await saveSettings.mutateAsync(settings);
      setJustSaved(true);
      showSuccess(
        "알림 설정 저장 완료",
        "알림 설정이 성공적으로 저장되었습니다."
      );
    } catch (error) {
      console.error("알림 설정 저장 오류:", error);
      const authError = getAuthErrorMessage(error);
      showError("알림 설정 저장 실패", authError.message);
    }
  };

  const isDisabled = !settings || saveSettings.isPending || justSaved;

  return (
    <div className="flex justify-end space-x-2">
      <Button
        onClick={handleSave}
        disabled={isDisabled}
        className="min-w-[100px]"
      >
        {saveSettings.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            저장 중...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            설정 저장
          </>
        )}
      </Button>
    </div>
  );
}
