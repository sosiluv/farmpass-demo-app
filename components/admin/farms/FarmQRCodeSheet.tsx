import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QrCode, Download, Copy, ExternalLink, Share2 } from "lucide-react";
import { BUTTONS, LABELS } from "@/lib/constants/farms";
import { useQRCodeActions } from "@/hooks/media/useQRCodeActions";
import { useState } from "react";

interface FarmQRCodeSheetProps {
  farmId: string;
  farmName: string;
  size?: number;
}

export function FarmQRCodeSheet({
  farmId,
  farmName,
  size = 256,
}: FarmQRCodeSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    copied,
    isMobile,
    supportsShare,
    handleDownload,
    handleShare,
    handleCopyUrl,
    handleOpenUrl,
  } = useQRCodeActions({ farmId, farmName, size });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="flex-1 min-w-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-700 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/40 dark:hover:to-teal-800/40 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 group"
        >
          <QrCode className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />
          <span className="font-medium text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200">
            {BUTTONS.QR_CODE_BUTTON}
          </span>
        </Button>
      </SheetTrigger>
      <CommonSheetContent
        side="bottom"
        enableDragToResize={true}
        onClose={() => setIsOpen(false)}
        open={isOpen}
      >
        <CommonSheetHeader
          title={LABELS.QR_CODE_TITLE.replace("{farmName}", farmName)}
          description={LABELS.QR_CODE_DESCRIPTION}
        />

        <ScrollArea className="flex-1">
          <div className="space-y-4 sm:space-y-6 p-2">
            {/* QR 코드 영역 */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="p-3 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl sm:rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 shadow-lg">
                  <QRCodeSVG
                    id={`qr-code-${farmId}`}
                    value={`${window.location.origin}/visit/${farmId}`}
                    size={Math.min(size, window.innerWidth < 640 ? 200 : size)}
                    level="H"
                    className="drop-shadow-sm"
                  />
                </div>
                {/* 장식 요소 - 모바일에서는 숨김 */}
                <div className="hidden sm:block absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full opacity-20"></div>
                <div className="hidden sm:block absolute -bottom-2 -left-2 w-3 h-3 bg-teal-400 rounded-full opacity-20"></div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              {/* 모바일에서는 공유 버튼, 데스크톱에서는 다운로드 버튼 */}
              {isMobile && supportsShare ? (
                <Button
                  onClick={handleShare}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {BUTTONS.QR_CODE_SHARE}
                </Button>
              ) : (
                <Button
                  onClick={handleDownload}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {BUTTONS.QR_CODE_DOWNLOAD}
                </Button>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="flex-1 h-12 bg-background hover:bg-accent border-border hover:border-border/80 transition-all duration-200 text-foreground text-sm sm:text-base"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? BUTTONS.QR_CODE_COPY_SUCCESS : BUTTONS.QR_CODE_COPY}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenUrl}
                  className="flex-1 h-12 bg-background hover:bg-accent border-border hover:border-border/80 transition-all duration-200 text-foreground text-sm sm:text-base"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {BUTTONS.QR_CODE_OPEN_LINK}
                </Button>
              </div>
            </div>

            {/* URL 표시 영역 */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-600">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                {LABELS.QR_CODE_LINK_TITLE}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 break-all leading-relaxed">
                {`${window.location.origin}/visit/${farmId}`}
              </div>
              <div className="text-sm text-muted-foreground dark:text-slate-400 mt-2 text-center">
                {LABELS.QR_CODE_SCAN_INFO}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CommonSheetContent>
    </Sheet>
  );
}
