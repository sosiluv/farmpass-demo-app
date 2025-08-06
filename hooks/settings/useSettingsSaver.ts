import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useSystemSettingsMutations } from "@/lib/hooks/query/use-system-settings-mutations";
import type { SystemSettings } from "@/lib/types/settings";

interface UseSettingsSaverProps {
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
}: UseSettingsSaverProps) {
  const { showInfo, showSuccess, showError } = useCommonToast();
  const systemMutations = useSystemSettingsMutations();

  const handleSaveAll = async (localSettings: SystemSettings) => {
    if (systemMutations.isLoading) return;

    // 저장 시작 알림
    showInfo("설정 저장 시작", "설정을 저장하는 중입니다...");

    try {
      // 1. 설정 저장 (React Query mutation이 자동으로 캐시 무효화 처리)
      const result = await systemMutations.saveSettingsAsync(localSettings);

      // 2. 데이터 갱신 (React Query 캐시가 이미 업데이트됨)
      await refetch();

      // 4. UI 상태 업데이트
      onSettingsUpdate(result);
      onUnsavedChangesChange(false);

      // 5. 시스템 모드 설정이 변경된 경우 즉시 적용
      await refreshSystemModes();

      showSuccess("설정 저장 완료", result.message || "설정이 저장되었습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("설정 저장 실패", errorMessage);
    }
  };

  return {
    saving: systemMutations.isLoading,
    handleSaveAll,
  };
}
