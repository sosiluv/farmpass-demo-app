import { useState } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { apiClient } from "@/lib/utils/api-client";
import { handleError } from "@/lib/utils/handleError";
import type { SystemSettings } from "@/lib/types/settings";

interface SettingsSaverProps {
  onSettingsUpdate: (updatedSettings: SystemSettings) => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
  refreshSystemModes: () => Promise<void>;
  refetch: () => Promise<SystemSettings | undefined>;
}

export function useSettingsSaver({
  onSettingsUpdate,
  onUnsavedChangesChange,
  refreshSystemModes,
  refetch,
}: SettingsSaverProps) {
  const toast = useCommonToast();
  const [saving, setSaving] = useState(false);

  const handleSaveAll = async (localSettings: SystemSettings) => {
    if (saving) return;

    setSaving(true);

    // 저장 시작 알림
    toast.showInfo("설정 저장 시작", "설정을 저장하는 중입니다...");

    try {
      // 1. 설정 저장
      const updatedSettings = await apiClient("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localSettings),
        context: "설정 저장",
        onError: (error, context) => {
          handleError(error, context);
          toast.showCustomError("설정 저장 실패", "설정 저장에 실패했습니다.");
        },
      });

      // 2. 캐시 무효화
      await apiClient("/api/settings/invalidate-cache", {
        method: "POST",
        context: "설정 캐시 무효화",
        onError: (error, context) => {
          handleError(error, context);
          toast.showWarning(
            "캐시 무효화 실패",
            "설정은 저장되었지만 캐시 갱신에 실패했습니다."
          );
        },
      });

      // 3. 데이터 갱신
      await refetch();

      // 4. UI 상태 업데이트
      onSettingsUpdate(updatedSettings);
      onUnsavedChangesChange(false);

      // 5. 시스템 모드 설정이 변경된 경우 즉시 적용
      await refreshSystemModes();

      toast.showCustomSuccess("설정 저장 완료", "설정이 저장되었습니다.");
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSaveAll,
  };
}
