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
import { useAdminDashboardQuery } from "@/lib/hooks/query/use-admin-dashboard-query";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { StatsSkeleton } from "@/components/common/skeletons";
import { BarChart3, TrendingUp } from "lucide-react";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";

export function DashboardTab() {
  const { data: stats, isLoading: loading, refetch } = useAdminDashboardQuery();

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
        title="데이터를 불러오지 못했습니다"
        description="네트워크 상태를 확인하거나 다시 시도해 주세요."
        retry={retry}
        error={new Error("Timeout: 데이터 로딩 10초 초과")}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton columns={4} />
        <StatsSkeleton columns={2} />
        <StatsSkeleton columns={3} />
      </div>
    );
  }

  if (!stats) return;

  return (
    <ErrorBoundary
      title="대시보드 오류"
      description="대시보드 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <CommonPageWrapper>
        {/* 핵심 통계 섹션 */}
        <section className="space-y-4 lg:space-y-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>핵심 통계</span>
          </div>
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
            <span>상세 분석</span>
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
