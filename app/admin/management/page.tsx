"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/admin/management/tabs/DashboardTab";
import { UsersTab } from "@/components/admin/management/tabs/UsersTab";
import { FarmsTab } from "@/components/admin/management/tabs/FarmsTab";
import { LogsTab } from "@/components/admin/management/tabs/LogsTab";
import { BarChart3, Users, Building2, FileText, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { AccessDenied } from "@/components/error/access-denied";
import { useAuth } from "@/components/providers/auth-provider";

export default function SystemManagementPage() {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;

  // admin 권한 체크
  if (profile && profile.account_type !== "admin") {
    return (
      <AccessDenied
        title="시스템 관리 접근 권한이 없습니다"
        description="시스템 관리 기능은 관리자만 접근할 수 있습니다."
        requiredRole="관리자"
        currentRole="일반 사용자"
      />
    );
  }

  return (
    <ErrorBoundary
      title="시스템 관리 오류"
      description="시스템 관리 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="시스템 관리"
          description="사용자, 농장, 시스템 로그 등을 관리합니다"
          breadcrumbs={[{ label: "시스템 관리" }]}
        />

        <div className="space-y-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger
                value="dashboard"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  대시보드
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  사용자
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="farms"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  농장
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  로그
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab />
            </TabsContent>

            <TabsContent value="users">
              <UsersTab />
            </TabsContent>

            <TabsContent value="farms">
              <FarmsTab />
            </TabsContent>

            <TabsContent value="logs">
              <LogsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}
