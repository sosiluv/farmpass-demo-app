"use client";

import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AdminSidebar,
  MobileHeader,
  MobileMenuButton,
} from "@/components/layout";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { MaintenanceBanner } from "@/components/maintenance";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { ThemeProvider } from "@/components/common/theme-provider";
import { DialogManager } from "@/components/common/DialogManager";
import { RealtimeNotificationBell } from "@/components/common/RealtimeNotificationBell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PWAUpdater } from "@/components/common/pwa-updater";

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
        <PWAUpdater />
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
                <MobileHeader />
                <MaintenanceBanner isAdmin={true} />
                <RealtimeNotificationBell />
                <main className="flex-1 p-4 md:p-6 pt-15 md:pt-12">
                  {children}
                </main>
              </SidebarInset>
              <MobileMenuButton />
              {/* Admin 페이지에서만 알림 권한 다이얼로그 관리 */}
              <DialogManager />
            </SidebarProvider>
          </ProtectedRoute>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
