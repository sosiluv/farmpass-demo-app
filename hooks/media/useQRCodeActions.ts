import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/ui/use-mobile";

interface UseQRCodeActionsProps {
  farmId: string;
  farmName: string;
  size?: number;
}

interface QRCodeActions {
  copied: boolean;
  isMobile: boolean;
  supportsShare: boolean;
  handleDownload: () => void;
  handleShare: () => Promise<void>;
  handleCopyUrl: () => Promise<void>;
  handleOpenUrl: () => void;
}

export function useQRCodeActions({
  farmId,
  farmName,
  size = 256,
}: UseQRCodeActionsProps): QRCodeActions {
  const [copied, setCopied] = useState(false);
  const qrUrl = `${window.location.origin}/visit/${farmId}`;

  // 모바일 감지 - useIsMobile 훅 사용
  const isMobile = useIsMobile();
  const supportsShare = "share" in navigator && "canShare" in navigator;

  // SVG를 Blob으로 변환하는 유틸리티 함수
  const convertSVGToBlob = useCallback(
    (onSuccess: (blob: Blob) => void) => {
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

        canvas.toBlob((blob) => {
          if (blob) {
            onSuccess(blob);
          }
        });
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    },
    [farmId, size]
  );

  // 다운로드 처리
  const handleDownload = useCallback(() => {
    convertSVGToBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.download = `${farmName}-qr-code.png`;
      downloadLink.href = url;
      downloadLink.click();
      URL.revokeObjectURL(url);
    });
  }, [convertSVGToBlob, farmName]);

  // 공유 처리
  const handleShare = useCallback(async () => {
    try {
      convertSVGToBlob(async (blob) => {
        const file = new File([blob], `${farmName}-qr-code.png`, {
          type: "image/png",
        });

        try {
          await navigator.share({
            files: [file],
            title: `${farmName} QR 코드`,
            text: "방문자 등록용 QR 코드입니다",
          });
        } catch (error) {
          // 공유 취소 시 다운로드로 폴백
          handleDownload();
        }
      });
    } catch (error) {
      console.error("Share failed:", error);
      handleDownload();
    }
  }, [convertSVGToBlob, farmName, handleDownload]);

  // URL 복사 처리
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  }, [qrUrl]);

  // URL 열기 처리
  const handleOpenUrl = useCallback(() => {
    window.open(qrUrl, "_blank");
  }, [qrUrl]);

  return {
    copied,
    isMobile,
    supportsShare,
    handleDownload,
    handleShare,
    handleCopyUrl,
    handleOpenUrl,
  };
}
