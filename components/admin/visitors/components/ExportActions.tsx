import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommonSheetFooter } from "@/components/ui/sheet-common";
import { BUTTONS, LABELS } from "@/lib/constants/visitor";

interface ExportActionsProps {
  isExporting: boolean;
  canExport: boolean;
  onExport: () => void;
  onReset: () => void;
}

export function ExportActions({
  isExporting,
  canExport,
  onExport,
  onReset,
}: ExportActionsProps) {
  return (
    <CommonSheetFooter
      onCancel={onReset}
      onConfirm={onExport}
      cancelText={BUTTONS.EXPORT_ACTIONS_RESET}
      confirmText={
        isExporting
          ? BUTTONS.EXPORT_ACTIONS_EXPORTING
          : BUTTONS.EXPORT_ACTIONS_CSV_DOWNLOAD
      }
      isLoading={isExporting}
      disabled={isExporting || !canExport}
      confirmIcon={
        isExporting ? (
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
        ) : (
          <Download className="h-3 w-3 mr-2" />
        )
      }
    />
  );
}
