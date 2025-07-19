import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImagePreviewDialogProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption?: string;
}

/**
 * 모바일 최적화 공통 이미지 상세보기 다이얼로그
 * - 풀스크린, 터치 닫기, pinch-zoom 지원
 * - ShadCN Dialog 기반
 */
export function ImagePreviewDialog({
  src,
  alt,
  open,
  onOpenChange,
  caption,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 max-w-full w-full h-full flex flex-col items-center justify-center bg-black/90 rounded-none sm:rounded-lg"
        style={{ maxWidth: "100vw", maxHeight: "100vh" }}
      >
        <DialogTitle className="sr-only">
          {alt || "이미지 미리보기"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          이미지를 확대하여 자세히 볼 수 있습니다.
        </DialogDescription>
        <button
          className="absolute top-3 right-3 z-10 bg-black/60 rounded-full p-2 text-white focus:outline-none"
          onClick={() => onOpenChange(false)}
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center justify-center w-full h-full">
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-full object-contain select-none touch-pan-x touch-pan-y"
            style={{
              touchAction: "pan-x pan-y",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>
        {caption && (
          <div className="w-full text-center text-xs text-white bg-black/60 py-2 px-4 truncate">
            {caption}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
