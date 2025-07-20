import React from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
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
    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 md:pt-6">
      <Button
        variant="outline"
        onClick={onReset}
        className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
        disabled={isExporting}
      >
        {resetButtonText}
      </Button>
      <Button
        onClick={onExport}
        disabled={isExporting || !canExport}
        className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
      >
        {isExporting ? (
          BUTTONS.EXPORTING
        ) : (
          <>
            <Download className="h-3 w-3 mr-2" />
            {exportButtonText}
          </>
        )}
      </Button>
    </DialogFooter>
  );
}
