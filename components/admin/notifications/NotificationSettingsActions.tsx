import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";
import { Save, Loader2 } from "lucide-react";

export function NotificationSettingsActions() {
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { unsavedSettings, hasUnsavedChanges, setSettings } =
    useNotificationSettingsStore();
  const { showInfo, showError, showSuccess } = useCommonToast();

  useEffect(() => {
    if (hasUnsavedChanges() && justSaved) {
      setJustSaved(false);
    }
  }, [unsavedSettings, hasUnsavedChanges, justSaved]);

  const handleSave = async () => {
    showInfo("알림 설정 저장 시작", "알림 설정을 저장하는 중입니다...");
    setLoading(true);
    try {
      const savedSettings = await apiClient("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unsavedSettings),
        context: "알림 설정 저장",
        onError: (error, context) => {
          handleError(error, context);
          showError(
            "알림 설정 저장 실패",
            "알림 설정을 저장하는 중 오류가 발생했습니다"
          );
        },
      });

      setSettings(savedSettings);
      setJustSaved(true);
      showSuccess(
        "알림 설정 저장 완료",
        "알림 설정이 성공적으로 저장되었습니다."
      );
      // 필요하다면 캐시 무효화 로직 추가
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setLoading(false);
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
