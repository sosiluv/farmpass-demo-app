"use client";

import React from "react";
import { CommonPageWrapper } from "../shared/CommonPageWrapper";
import { DashboardStats } from "../dashboard/DashboardStats";
import { FarmTypeDistribution } from "../dashboard/FarmTypeDistribution";
import { UserRoleDistribution } from "../dashboard/UserRoleDistribution";
import { RegionDistribution } from "../dashboard/RegionDistribution";
import { MonthlyTrends } from "../dashboard/MonthlyTrends";
import { SystemUsage } from "../dashboard/SystemUsage";
import { RecentActivities } from "../dashboard/RecentActivities";
import { useAdminDashboardStatsQuery } from "@/lib/hooks/query/use-admin-dashboard-query";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { StatsSkeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/system/useTimeout";
import { LABELS } from "@/lib/constants/management";

export function DashboardTab() {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useAdminDashboardStatsQuery();

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(
    loading,
    async () => {
      await refetch();
    },
    {
      timeout: 10000,
    }
  );

  if (timeoutReached) {
    return (
      <AdminError
        title={ERROR_CONFIGS.TIMEOUT.title}
        description={ERROR_CONFIGS.TIMEOUT.description}
        retry={retry}
        error={new Error("Timeout: 데이터 로딩 10초 초과")}
        isTimeout={true}
      />
    );
  }

  if (loading) {
    return (
      <CommonPageWrapper>
        <div className="space-y-6">
          <StatsSkeleton columns={4} />
          <StatsSkeleton columns={2} />
          <StatsSkeleton columns={3} />
        </div>
      </CommonPageWrapper>
    );
  }

  if (error) {
    return (
      <AdminError
        title={ERROR_CONFIGS.LOADING.title}
        description={ERROR_CONFIGS.LOADING.description}
        retry={refetch}
        error={error as Error}
      />
    );
  }

  if (!stats) return;

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <CommonPageWrapper>
        {/* 핵심 통계 섹션 */}
        <section className="space-y-4 lg:space-y-6">
          <DashboardStats
            totalUsers={stats.totalUsers}
            totalFarms={stats.totalFarms}
            totalVisitors={stats.totalVisitors}
            totalLogs={stats.totalLogs}
            trends={stats.trends}
          />
        </section>

        {/* 상세 분석 섹션 */}
        <section className="space-y-4 lg:space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{LABELS.DETAILED_ANALYSIS}</span>
          </div>

          {/* 주요 차트들 - 2열 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <FarmTypeDistribution data={stats.farmTypeData} />
            <UserRoleDistribution data={stats.userRoleData} />
          </div>

          {/* 중간 차트들 - 태블릿에서는 1열, 큰 데스크톱에서만 3열 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <RegionDistribution data={stats.regionData} />
            <SystemUsage data={stats.systemUsageData} />
            <MonthlyTrends data={stats.monthlyData} />
          </div>

          {/* 최근 활동 - 전체 너비 */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <RecentActivities activities={stats.recentActivities} />
          </div>
        </section>
      </CommonPageWrapper>
    </ErrorBoundary>
  );
}
