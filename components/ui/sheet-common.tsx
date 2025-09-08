"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useDragToResize } from "@/hooks/ui/use-gesture";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetContent as BaseSheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// 공통 시트 헤더 Props
interface CommonSheetHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  show?: boolean;
  hideDescription?: boolean;
}

// 공통 시트 푸터 Props
interface CommonSheetFooterProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  confirmIcon?: React.ReactNode;
}

// 공통 시트 컨텐츠 Props
interface CommonSheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  enableDragToResize?: boolean;
  onClose?: () => void;
  initialHeight?: number;
  minHeight?: number;
  maxHeightVh?: number;
  onResize?: (height: number) => void;
  open?: boolean; // 모달 열림 상태 추가
  showCloseButton?: boolean; // X 버튼 표시 여부
  showHandle?: boolean; // 핸들바 표시 여부 (디자인용)
}

// 공통 시트 헤더 컴포넌트
export function CommonSheetHeader({
  title,
  description,
  className,
  children,
  show = true,
  hideDescription = false,
}: CommonSheetHeaderProps) {
  return (
    <>
      {/* 접근성을 위한 항상 렌더링되는 제목과 설명 */}
      <SheetTitle className="sr-only">{title}</SheetTitle>
      <SheetDescription className="sr-only">
        {description || "확인 다이얼로그"}
      </SheetDescription>

      {/* 시각적으로 보이는 헤더 */}
      {show && (
        <SheetHeader
          className={cn(
            "text-center space-y-2 pb-3 border-b border-gray-100/60",
            className
          )}
        >
          <SheetTitle className="text-xl font-bold text-gray-900 leading-tight tracking-tight text-center">
            {title}
          </SheetTitle>
          {description && !hideDescription && (
            <SheetDescription className="text-base text-gray-600 leading-relaxed max-w-sm sm:max-w-md mx-auto font-medium text-center">
              {description}
            </SheetDescription>
          )}

          {children}
        </SheetHeader>
      )}
    </>
  );
}

// 공통 시트 푸터 컴포넌트
export function CommonSheetFooter({
  onCancel,
  onConfirm,
  cancelText = "취소",
  confirmText = "확인",
  isLoading = false,
  disabled = false,
  className,
  children,
  confirmIcon,
}: CommonSheetFooterProps) {
  return (
    <SheetFooter
      className={cn("flex flex-row gap-3 pt-6 sticky bottom-0", className)}
    >
      {children || (
        <>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || disabled}
            className="h-12 sm:h-14 text-base flex-1 border-2"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || disabled}
            className="h-12 sm:h-14 text-base font-semibold flex-1 bg-primary hover:bg-primary/90 shadow-lg"
          >
            {confirmIcon}
            {confirmText}
          </Button>
        </>
      )}
    </SheetFooter>
  );
}

// 공통 시트 컨텐츠 컴포넌트
export function CommonSheetContent({
  children,
  className,
  side = "bottom",
  enableDragToResize = true, // 기본값을 true로 변경
  initialHeight,
  minHeight,
  maxHeightVh,
  onResize,
  onClose,
  open,
  showCloseButton = true,
  showHandle = false,
}: CommonSheetContentProps) {
  // 크기 조정 훅
  const {
    bind: resizeBind,
    height,
    isDragging,
  } = useDragToResize({
    initialHeight,
    minHeight,
    maxHeight: maxHeightVh,
    onResize,
    onClose,
    enabled: enableDragToResize && side === "bottom",
    open,
  });

  return (
    <BaseSheetContent
      side={side}
      showCloseButton={showCloseButton}
      onInteractOutside={(e) => e.preventDefault()} // 빈 공간 클릭 시 닫히지 않도록 방지
      className={cn(
        "max-w-2xl mx-2 md:mx-auto overflow-y-auto p-3 sm:p-6 touch-none rounded-t-[20px] rounded-b-[20px] sm:rounded-t-[24px] sm:rounded-b-[24px] border-t-2 border-primary/20 mb-4 flex flex-col",
        enableDragToResize && side === "bottom"
          ? "transition-none"
          : "max-h-[95vh]",
        className
      )}
      style={
        enableDragToResize && side === "bottom"
          ? { height: `${height}vh` }
          : undefined
      }
    >
      {/* 크기 조정 핸들 또는 디자인용 핸들 */}
      {(enableDragToResize || showHandle) && side === "bottom" && (
        <div
          {...(enableDragToResize ? resizeBind() : {})}
          className={cn(
            "flex justify-center pt-3 pb-2 select-none touch-manipulation",
            enableDragToResize
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-default"
          )}
        >
          <div
            className={cn(
              "w-12 h-1.5 rounded-full transition-all duration-150",
              enableDragToResize && isDragging
                ? "bg-primary w-16 h-2 shadow-sm"
                : "bg-gray-300 hover:bg-gray-400 active:bg-gray-500"
            )}
          ></div>
        </div>
      )}

      {children}
    </BaseSheetContent>
  );
}
