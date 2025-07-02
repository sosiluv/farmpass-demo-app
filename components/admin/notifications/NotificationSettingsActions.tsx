import { Button } from "@/components/ui/button";
import { useMutation } from "@/hooks/common/useApiData";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Icons } from "@/components/common/icons";

export function NotificationSettingsActions() {
  const [justSaved, setJustSaved] = useState(false);

  const { mutate: updateSettings, loading } = useMutation(
    async (settings) => {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("알림 설정 업데이트에 실패했습니다.");
      }

      return response.json();
    },
    {
      errorMessage: "알림 설정을 저장하는 중 오류가 발생했습니다.",
      invalidateCache: "notification-settings",
    }
  );

  const { unsavedSettings, hasUnsavedChanges, setSettings } =
    useNotificationSettingsStore();

  const toast = useCommonToast();

  // 변경사항이 있으면 justSaved 상태를 리셋
  useEffect(() => {
    if (hasUnsavedChanges() && justSaved) {
      setJustSaved(false);
    }
  }, [unsavedSettings, hasUnsavedChanges, justSaved]);

  const handleSave = async () => {
    try {
      const savedSettings = await updateSettings(unsavedSettings);
      setSettings(savedSettings);
      setJustSaved(true);
      toast.showSuccess("NOTIFICATION_SETTINGS_SAVED");
    } catch (error) {
      toast.showError("NOTIFICATION_SETTINGS_SAVE_FAILED");
    }
  };

  const isDisabled = !hasUnsavedChanges() || loading || justSaved;

  return (
    <div className="flex justify-end mt-6">
      <Button
        onClick={handleSave}
        disabled={isDisabled}
        className="flex items-center"
      >
        {loading ? (
          <>
            <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
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
