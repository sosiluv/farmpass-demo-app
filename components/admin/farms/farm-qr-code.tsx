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
import { QrCode, Download } from "lucide-react";

interface FarmQRCodeProps {
  farmId: string;
  farmName: string;
  size?: number;
}

export function FarmQRCode({ farmId, farmName, size = 256 }: FarmQRCodeProps) {
  const qrUrl = `${window.location.origin}/visit/${farmId}`;

  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-${farmId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${farmName}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{farmName} QR 코드</DialogTitle>
          <DialogDescription>
            방문자 등록을 위한 QR 코드입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 p-4">
          <QRCodeSVG
            id={`qr-code-${farmId}`}
            value={qrUrl}
            size={size}
            includeMargin
            level="H"
          />
          <Button onClick={handleDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            QR 코드 다운로드
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            QR 코드를 스캔하면 방문자 등록 페이지로 이동합니다.
            <br />
            {qrUrl}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
