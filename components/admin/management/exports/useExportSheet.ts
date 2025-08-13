import { useState } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";

interface UseExportSheetOptions {
  onExport: (options: any) => Promise<void>;
  validateOptions?: (options: any) => { isValid: boolean; message?: string };
  successMessage?: string;
  errorMessage?: string;
}

export function useExportSheet({
  onExport,
  validateOptions,
  successMessage = "데이터가 성공적으로 내보내졌습니다.",
  errorMessage = "데이터 내보내기 중 오류가 발생했습니다.",
}: UseExportSheetOptions) {
  const { showError, showInfo, showSuccess } = useCommonToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (options: any) => {
    // 유효성 검사
    if (validateOptions) {
      const validation = validateOptions(options);
      if (!validation.isValid) {
        showError(
          "유효성 검사 오류",
          validation.message || "옵션이 올바르지 않습니다."
        );
        return;
      }
    }

    try {
      setIsExporting(true);

      // 내보내기 시작 알림
      showInfo("내보내기 시작", "데이터를 내보내는 중입니다...");

      await onExport(options);

      showSuccess("내보내기 완료", successMessage);

      setIsOpen(false);
    } catch (error) {
      devLog.error("내보내기 오류:", error);
      handleError(error, "데이터 내보내기");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("내보내기 실패", errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    isExporting,
    handleExport,
  };
}
