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
import { BUTTONS, LABELS } from "@/lib/constants/farms";

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
          <DialogTitle>
            {LABELS.QR_CODE_TITLE.replace("{farmName}", farmName)}
          </DialogTitle>
          <DialogDescription>{LABELS.QR_CODE_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 p-4">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG
              id={`qr-code-${farmId}`}
              value={qrUrl}
              size={size}
              level="H"
            />
          </div>
          <Button onClick={handleDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            {BUTTONS.QR_CODE_DOWNLOAD}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {LABELS.QR_CODE_SCAN_INFO}
            <br />
            {qrUrl}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
