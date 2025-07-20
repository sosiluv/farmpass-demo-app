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
import { ERROR_CONFIGS } from "@/lib/constants/error";
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
          title={ERROR_CONFIGS.GENERAL.title}
          description={ERROR_CONFIGS.GENERAL.description}
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
