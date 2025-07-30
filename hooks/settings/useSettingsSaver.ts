import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useSystemSettingsMutations } from "@/lib/hooks/query/use-system-settings-mutations";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
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
  const { showInfo, showWarning, showSuccess, showError } = useCommonToast();
  const systemMutations = useSystemSettingsMutations();

  const handleSaveAll = async (localSettings: SystemSettings) => {
    if (systemMutations.isLoading) return;

    // 저장 시작 알림
    showInfo("설정 저장 시작", "설정을 저장하는 중입니다...");

    try {
      // 1. 설정 저장 (React Query mutation 사용)
      const result = await systemMutations.saveSettingsAsync(localSettings);

      // 2. 캐시 무효화 (React Query mutation 사용)
      try {
        await systemMutations.invalidateCacheAsync();
      } catch (cacheError) {
        showWarning(
          "캐시 무효화 실패",
          "설정은 저장되었지만 캐시 갱신에 실패했습니다."
        );
      }

      // 3. 데이터 갱신
      await refetch();

      // 4. UI 상태 업데이트
      onSettingsUpdate(result);
      onUnsavedChangesChange(false);

      // 5. 시스템 모드 설정이 변경된 경우 즉시 적용
      await refreshSystemModes();

      showSuccess("설정 저장 완료", result.message || "설정이 저장되었습니다.");
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      showError("설정 저장 실패", authError.message);
    }
  };

  return {
    saving: systemMutations.isLoading,
    handleSaveAll,
  };
}
