import { useState } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface UseExportDialogOptions {
  onExport: (options: any) => Promise<void>;
  validateOptions?: (options: any) => { isValid: boolean; message?: string };
  successMessage?: string;
  errorMessage?: string;
}

export function useExportDialog({
  onExport,
  validateOptions,
  successMessage = "데이터가 성공적으로 내보내졌습니다.",
  errorMessage = "데이터 내보내기 중 오류가 발생했습니다.",
}: UseExportDialogOptions) {
  const toast = useCommonToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (options: any) => {
    // 유효성 검사
    if (validateOptions) {
      const validation = validateOptions(options);
      if (!validation.isValid) {
        toast.showCustomError(
          "유효성 검사 오류",
          validation.message || "옵션이 올바르지 않습니다."
        );
        return;
      }
    }

    try {
      setIsExporting(true);
      await onExport(options);

      toast.showCustomSuccess("내보내기 완료", successMessage);

      setIsOpen(false);
    } catch (error) {
      devLog.error("내보내기 오류:", error);
      toast.showCustomError("내보내기 실패", errorMessage);
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
