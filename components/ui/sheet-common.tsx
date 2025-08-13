"use client";

import React from "react";
import { cn } from "@/lib/utils";
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
  showHandle?: boolean;
  enableDragToClose?: boolean;
  dragDirection?: "horizontal" | "vertical";
  dragThreshold?: number;
  onClose?: () => void;
  maxHeight?: string;
  maxWidth?: string;
}

// 공통 시트 헤더 컴포넌트
export function CommonSheetHeader({
  title,
  description,
  className,
  children,
  show = true,
}: CommonSheetHeaderProps) {
  return (
    <>
      {/* 접근성을 위한 항상 렌더링되는 제목과 설명 */}
      <SheetTitle className="sr-only">{title}</SheetTitle>
      {description && (
        <SheetDescription className="sr-only">{description}</SheetDescription>
      )}

      {/* 시각적으로 보이는 헤더 */}
      {show && (
        <SheetHeader
          className={cn(
            "text-center space-y-3 pb-6 border-b border-gray-100/60",
            className
          )}
        >
          <SheetTitle className="text-xl font-bold text-gray-900 leading-tight tracking-tight text-center">
            {title}
          </SheetTitle>
          {description && (
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
      className={cn(
        "flex flex-row gap-3 pt-6 pb-4 sm:pb-6 sticky bottom-0",
        className
      )}
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
            className="h-12 sm:h-14 text-base sm:text-lg font-semibold flex-1 bg-primary hover:bg-primary/90 shadow-lg"
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
  showHandle = true,
  enableDragToClose = true,
  dragDirection = "vertical",
  dragThreshold = 50,
  onClose,
}: CommonSheetContentProps) {
  return (
    <BaseSheetContent
      side={side}
      className={cn(
        "max-h-[95vh] max-w-2xl mx-2 md:mx-auto overflow-y-auto p-3 sm:p-6 touch-none rounded-t-[20px] rounded-b-[20px] sm:rounded-t-[24px] sm:rounded-b-[24px] border-t-2 border-primary/20 mb-4 flex flex-col",
        className
      )}
      showHandle={showHandle}
      enableDragToClose={enableDragToClose}
      dragDirection={dragDirection}
      dragThreshold={dragThreshold}
      onClose={onClose}
    >
      {children}
    </BaseSheetContent>
  );
}
