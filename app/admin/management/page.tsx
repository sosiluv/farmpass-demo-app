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
import { LABELS, PAGE_HEADER } from "@/lib/constants/management";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { CardSkeleton } from "@/components/common/skeletons";

export default function SystemManagementPage() {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile, isLoading: profileLoading } = useProfileQuery(userId);

  // 프로필 로딩 중일 때는 스켈레톤 표시
  if (profileLoading) {
    return (
      <div className="flex-1 space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          icon={Shield}
        />
        <CardSkeleton count={4} />
      </div>
    );
  }

  // admin 권한 체크
  if (!profile || profile.account_type !== "admin") {
    return (
      <AccessDenied
        title={ERROR_CONFIGS.PERMISSION.title}
        description={ERROR_CONFIGS.PERMISSION.description}
        requiredRole="관리자"
        currentRole="일반 사용자"
      />
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          icon={Shield}
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
                  {LABELS.TABS.DASHBOARD}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  {LABELS.TABS.USERS}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="farms"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  {LABELS.TABS.FARMS}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
              >
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                  {LABELS.TABS.LOGS}
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
