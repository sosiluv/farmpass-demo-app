"use client";

import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AdminSidebar,
  MobileHeader,
  MobileMenuButton,
} from "@/components/layout";
import { FarmsProvider } from "@/components/providers/farms-provider";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { MaintenanceBanner } from "@/components/maintenance";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ThemeProvider } from "@/components/common/theme-provider";
import { DialogManager } from "@/components/common/DialogManager";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ProtectedRoute>
        <ErrorBoundary
          title="관리자 페이지 오류"
          description="관리자 기능을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
        >
          <SidebarProvider>
            <FarmsProvider>
              <AdminSidebar />
              <SidebarInset>
                <MobileHeader />
                <MaintenanceBanner isAdmin={true} />
                <main className="flex-1 p-4 md:p-6">{children}</main>
              </SidebarInset>
              <MobileMenuButton />
              {/* Admin 페이지에서만 알림 권한 다이얼로그 관리 */}
              <DialogManager />
            </FarmsProvider>
          </SidebarProvider>
        </ErrorBoundary>
      </ProtectedRoute>
    </ThemeProvider>
  );
}
