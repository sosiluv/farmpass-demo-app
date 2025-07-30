import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode, Download, Copy, ExternalLink, Share2 } from "lucide-react";
import { BUTTONS, LABELS } from "@/lib/constants/farms";
import { useQRCodeActions } from "@/hooks/media/useQRCodeActions";

interface FarmQRCodeProps {
  farmId: string;
  farmName: string;
  size?: number;
}

export function FarmQRCode({ farmId, farmName, size = 256 }: FarmQRCodeProps) {
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-0 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition-all duration-200 group"
        >
          <QrCode className="h-4 w-4 mr-2 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
          <span className="font-medium text-emerald-700 group-hover:text-emerald-800">
            {BUTTONS.QR_CODE_BUTTON}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-emerald-700">
            {LABELS.QR_CODE_TITLE.replace("{farmName}", farmName)}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {LABELS.QR_CODE_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* QR 코드 영역 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-3 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl border-2 border-emerald-200 shadow-lg">
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
                className="w-full h-12 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {BUTTONS.QR_CODE_SHARE}
              </Button>
            ) : (
              <Button
                onClick={handleDownload}
                className="w-full h-12 sm:h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                <Download className="h-4 w-4 mr-2" />
                {BUTTONS.QR_CODE_DOWNLOAD}
              </Button>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="flex-1 h-12 sm:h-10 bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 transition-all duration-200 text-sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? BUTTONS.QR_CODE_COPY_SUCCESS : BUTTONS.QR_CODE_COPY}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenUrl}
                className="flex-1 h-12 sm:h-10 bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 transition-all duration-200 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {BUTTONS.QR_CODE_OPEN_LINK}
              </Button>
            </div>
          </div>

          {/* URL 표시 영역 */}
          <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
            <div className="text-xs font-medium text-slate-600 mb-2">
              {LABELS.QR_CODE_LINK_TITLE}
            </div>
            <div className="text-xs text-slate-500 break-all leading-relaxed">
              {`${window.location.origin}/visit/${farmId}`}
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {LABELS.QR_CODE_SCAN_INFO}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
