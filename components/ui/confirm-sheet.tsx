"use client";

import { Sheet } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
  CommonSheetFooter,
} from "@/components/ui/sheet-common";
import {
  Loader2,
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ReactNode } from "react";

export interface ConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "destructive" | "warning" | "info" | "success";
  icon?: ReactNode;
  warningMessage?: string;
  children?: ReactNode;
}

const variantConfig = {
  destructive: {
    icon: Trash2,
    buttonVariant: "destructive" as const,
    warningBg: "bg-red-50",
    warningBorder: "border-red-200",
    warningText: "text-red-800",
    warningIconBg: "bg-red-100",
    warningIconColor: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    buttonVariant: "destructive" as const,
    warningBg: "bg-yellow-50",
    warningBorder: "border-yellow-200",
    warningText: "text-yellow-800",
    warningIconBg: "bg-yellow-100",
    warningIconColor: "text-yellow-600",
  },
  info: {
    icon: AlertCircle,
    buttonVariant: "default" as const,
    warningBg: "bg-blue-50",
    warningBorder: "border-blue-200",
    warningText: "text-blue-800",
    warningIconBg: "bg-blue-100",
    warningIconColor: "text-blue-600",
  },
  success: {
    icon: CheckCircle,
    buttonVariant: "default" as const,
    warningBg: "bg-green-50",
    warningBorder: "border-green-200",
    warningText: "text-green-800",
    warningIconBg: "bg-green-100",
    warningIconColor: "text-green-600",
  },
};

export function ConfirmSheet({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  isLoading = false,
  variant = "destructive",
  icon,
  warningMessage,
  children,
}: ConfirmSheetProps) {
  const config = variantConfig[variant];
  const DefaultIcon = config.icon;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CommonSheetContent
        side="bottom"
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={() => onOpenChange(false)}
        className="max-h-[85vh] min-h-[300px] w-[calc(100vw-2rem)] max-w-lg mx-auto overflow-y-auto p-0 gap-0 overflow-hidden"
      >
        <CommonSheetHeader title={title} description={description} />

        {/* 경고 메시지 */}
        {warningMessage && (
          <div className="flex-1 px-6 sm:px-8 py-4">
            <div
              className={`${config.warningBg} border ${config.warningBorder} rounded-lg p-4 sm:p-6`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div
                    className={`w-6 h-6 ${config.warningIconBg} rounded-full flex items-center justify-center`}
                  >
                    <DefaultIcon
                      className={`h-4 w-4 ${config.warningIconColor}`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${config.warningText} whitespace-pre-line`}
                  >
                    {warningMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 추가 내용 */}
        {children && <div className="flex-1 px-6 sm:px-8 py-4">{children}</div>}

        <CommonSheetFooter
          onCancel={handleCancel}
          onConfirm={onConfirm}
          cancelText={cancelText}
          confirmText={isLoading ? "처리 중..." : confirmText}
          isLoading={isLoading}
          disabled={isLoading}
          confirmIcon={
            isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <DefaultIcon className="h-5 w-5 mr-2" />
            )
          }
        />
      </CommonSheetContent>
    </Sheet>
  );
}

// 특정 용도별 시트 컴포넌트들
export function DeleteConfirmSheet({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "삭제 확인",
  description = "정말로 삭제하시겠습니까?",
  itemName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  itemName?: string;
}) {
  const warningMessage = itemName
    ? `${itemName}과 관련된 모든 데이터(방문 기록, 구성원 정보 등)가 영구적으로 삭제됩니다.`
    : "이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 영구적으로 삭제됩니다.";

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText="삭제"
      cancelText="취소"
      isLoading={isLoading}
      variant="destructive"
      icon={<Trash2 className="h-5 w-5" />}
      warningMessage={warningMessage}
    />
  );
}

export function WarningConfirmSheet({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "경고",
  description,
  confirmText = "확인",
  cancelText = "취소",
  warningMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  warningMessage?: string;
}) {
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
      variant="warning"
      icon={<AlertTriangle className="h-5 w-5" />}
      warningMessage={warningMessage}
    />
  );
}

export function InfoConfirmSheet({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "정보",
  description,
  confirmText = "확인",
  cancelText = "취소",
  infoMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  infoMessage?: string;
}) {
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
      variant="info"
      icon={<AlertCircle className="h-5 w-5" />}
      warningMessage={infoMessage}
    />
  );
}
