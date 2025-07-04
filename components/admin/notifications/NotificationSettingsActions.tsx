import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { Save } from "lucide-react";
import { Icons } from "@/components/common/icons";

export function NotificationSettingsActions() {
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const { unsavedSettings, hasUnsavedChanges, setSettings } =
    useNotificationSettingsStore();
  const toast = useCommonToast();

  useEffect(() => {
    if (hasUnsavedChanges() && justSaved) {
      setJustSaved(false);
    }
  }, [unsavedSettings, hasUnsavedChanges, justSaved]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unsavedSettings),
      });
      if (!response.ok) throw new Error("알림 설정 업데이트에 실패했습니다.");
      const savedSettings = await response.json();
      setSettings(savedSettings);
      setJustSaved(true);
      toast.showCustomSuccess(
        "알림 설정 저장 완료",
        "알림 설정이 성공적으로 저장되었습니다."
      );
      // 필요하다면 캐시 무효화 로직 추가
    } catch (error) {
      toast.showCustomError(
        "알림 설정 저장 실패",
        "알림 설정을 저장하는 중 오류가 발생했습니다"
      );
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
