"use client";

import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AdminSidebar,
  Header,
  MobileMenuButton,
  SidebarSwipeGuide,
} from "@/components/layout";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { MaintenanceBanner } from "@/components/maintenance";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { DialogManager } from "@/components/common/DialogManager";
import { AuthProvider } from "@/components/providers/auth-provider";

export default function AdminLayout({
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
          <ProtectedRoute>
            <SidebarProvider>
              <AdminSidebar />
              <SidebarInset>
                <Header />
                <MaintenanceBanner isAdmin={true} />
                {/* <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-3 pb-4 md:pb-6"> */}
                {children}
                {/* </main> */}
              </SidebarInset>
              <MobileMenuButton />
              {/* 사이드바 스와이프 닫기 가이드 */}
              <SidebarSwipeGuide />
              {/* Admin 페이지에서만 알림 권한 다이얼로그 관리 */}
              <DialogManager />
            </SidebarProvider>
          </ProtectedRoute>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
