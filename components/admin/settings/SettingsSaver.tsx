import { useState } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
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
  const { showCustomSuccess, showCustomError } = useCommonToast();
  const [saving, setSaving] = useState(false);

  const handleSaveAll = async (localSettings: SystemSettings) => {
    if (saving) return;

    setSaving(true);
    try {
      // 1. 설정 저장
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localSettings),
      });

      if (!response.ok) throw new Error("설정 저장에 실패했습니다.");

      const updatedSettings = await response.json();

      // 2. 캐시 무효화
      await fetch("/api/settings/invalidate-cache", { method: "POST" });

      // 3. 데이터 갱신
      await refetch();

      // 4. UI 상태 업데이트
      onSettingsUpdate(updatedSettings);
      onUnsavedChangesChange(false);

      // 5. 시스템 모드 설정이 변경된 경우 즉시 적용
      await refreshSystemModes();

      showCustomSuccess("설정 저장 완료", "설정이 저장되었습니다.");
    } catch (error) {
      showCustomError("설정 저장 실패", "설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSaveAll,
  };
}
