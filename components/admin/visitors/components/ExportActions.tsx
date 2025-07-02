import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

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
    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
      <Button
        variant="outline"
        onClick={onReset}
        disabled={isExporting}
        className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
      >
        초기화
      </Button>
      <Button
        onClick={onExport}
        disabled={isExporting || !canExport}
        className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm bg-primary hover:bg-primary/90"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
            내보내는 중...
          </>
        ) : (
          <>
            <Download className="h-3 w-3 mr-2" />
            CSV 다운로드
          </>
        )}
      </Button>
    </DialogFooter>
  );
}
