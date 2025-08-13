"use client";

import { useState } from "react";
import { usePinch, useDrag, useWheel } from "@use-gesture/react";
import { Sheet, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CommonSheetContent } from "@/components/ui/sheet-common";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  alt?: string;
}

/**
 * 이미지 확대 보기 시트
 * 핀치로 확대/축소, 드래그로 이동 가능
 */
export function ImageZoomModal({
  isOpen,
  onClose,
  imageUrl,
  title = "이미지 보기",
  alt = "확대된 이미지",
}: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState([0, 0]);

  // 핀치로 확대/축소
  const pinchBind = usePinch(
    ({ offset: [s], memo }) => {
      const newScale = Math.max(0.5, Math.min(5, s)); // 0.5배 ~ 5배 제한
      setScale(newScale);
      return memo;
    },
    {
      scaleBounds: { min: 0.5, max: 5 },
      rubberband: true,
    }
  );

  // 드래그로 이미지 이동
  const dragBind = useDrag(
    ({ offset: [x, y] }) => {
      setPosition([x, y]);
    },
    {
      enabled: scale > 1, // 확대된 상태에서만 드래그 가능
    }
  );

  // 마우스 휠로 확대/축소
  const wheelBind = useWheel(
    ({ delta: [, dy] }) => {
      const newScale = Math.max(0.5, Math.min(5, scale - dy * 0.01));
      setScale(newScale);
    },
    {
      preventDefault: true,
    }
  );

  // 초기화
  const handleReset = () => {
    setScale(1);
    setPosition([0, 0]);
  };

  // 확대/축소 버튼
  const handleZoomIn = () => setScale((prev) => Math.min(5, prev + 0.5));
  const handleZoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.5));

  // 시트 닫을 때 초기화
  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <CommonSheetContent
        side="bottom"
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={handleClose}
        className="max-h-[95vh] overflow-hidden p-0 touch-none [&>button]:hidden"
      >
        {/* 접근성을 위한 숨겨진 제목과 설명 */}
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">
          이미지를 확대/축소하고 이동할 수 있습니다. 모바일에서는 두 손가락으로
          확대/축소하고, 데스크톱에서는 마우스 휠을 사용하세요.
        </SheetDescription>

        <div className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
            <h2 className="text-lg font-semibold text-center sm:text-left">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              {/* 확대/축소 버튼 */}
              <Button
                variant="outline"
                size="default" // Mobile default size
                className="h-10 px-4 py-2 sm:h-11 sm:px-8" // Tablet+ lg size
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-12 text-center bg-muted px-2 py-1 rounded">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="default" // Mobile default size
                className="h-10 px-4 py-2 sm:h-11 sm:px-8" // Tablet+ lg size
                onClick={handleZoomIn}
                disabled={scale >= 5}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="default" // Mobile default size
                className="h-10 px-4 py-2 sm:h-11 sm:px-8" // Tablet+ lg size
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="default" // Mobile default size
                className="h-10 px-4 py-2 sm:h-11 sm:px-8" // Tablet+ lg size
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 이미지 영역 */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex items-center justify-center p-4">
          <div
            className="relative touch-none select-none"
            style={{
              width: "100%",
              height: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              {...pinchBind()}
              {...dragBind()}
              {...wheelBind()}
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              style={{
                transform: `translate(${position[0]}px, ${position[1]}px) scale(${scale})`,
                transformOrigin: "center",
                touchAction: "none",
                transition: "transform 0.1s ease-out",
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* 안내 텍스트 */}
        <div className="p-4 pt-2 border-t bg-gray-50">
          <p className="text-xs text-muted-foreground text-center">
            💡 모바일: 두 손가락으로 확대/축소 | 데스크톱: 마우스 휠로 확대/축소
          </p>
        </div>
      </CommonSheetContent>
    </Sheet>
  );
}
