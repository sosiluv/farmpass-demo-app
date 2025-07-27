import type React from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastPositionProvider } from "@/components/providers/toast-position-provider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";

/**
 * 방문자 폼 전용 레이아웃
 *
 * 외부인 전용 페이지이므로 AuthProvider를 완전히 제외하고
 * 최소한의 프로바이더만 사용합니다.
 *
 * 이 레이아웃은 루트 레이아웃의 AuthProvider를 우회합니다.
 */
export default function VisitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.GENERAL.title}
      description={ERROR_CONFIGS.GENERAL.description}
    >
      <QueryProvider>
        <ToastPositionProvider>
          {children}
          <Toaster />
        </ToastPositionProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
