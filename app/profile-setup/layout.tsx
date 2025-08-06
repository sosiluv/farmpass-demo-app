"use client";

import type React from "react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

export default function ProfileSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.GENERAL.title}
      description={ERROR_CONFIGS.GENERAL.description}
    >
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 헤더와 사이드바 없이 전체 화면 사용 */}
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
