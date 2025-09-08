import React from "react";
import { CommonSheetFooter } from "@/components/ui/sheet-common";
import { Download } from "lucide-react";
import { BUTTONS } from "@/lib/constants/management";

interface ExportActionsProps {
  isExporting: boolean;
  canExport: boolean;
  onExport: () => void;
  onReset: () => void;
  exportButtonText?: string;
  resetButtonText?: string;
}

export function ExportActions({
  isExporting,
  canExport,
  onExport,
  onReset,
  exportButtonText = BUTTONS.CSV_EXPORT,
  resetButtonText = BUTTONS.RESET,
}: ExportActionsProps) {
  return (
    <CommonSheetFooter
      onCancel={onReset}
      onConfirm={onExport}
      cancelText={resetButtonText}
      confirmText={exportButtonText}
      isLoading={isExporting}
      disabled={isExporting || !canExport}
      confirmIcon={
        isExporting ? undefined : <Download className="h-4 w-4 mr-2" />
      }
    />
  );
}
