"use client";

import React from "react";
import { Users } from "lucide-react";
import { useAdminUsersQuery } from "@/lib/hooks/query/use-admin-users-query";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  UserStats,
  UserList,
  UserFilters,
  UsersFilterManager,
  UsersExportManager,
} from "../users";
import { UsersExportRefactored } from "../exports";
import { CommonPageWrapper, CommonResultsSummary } from "../shared";
import { ResponsivePagination } from "@/components/ui/responsive-pagination";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/system/useTimeout";
import { LABELS } from "@/lib/constants/management";

export function UsersTab() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminUsersQuery();

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(
    loading,
    async () => {
      await refetch();
    },
    {
      timeout: 15000,
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
          <TableSkeleton rows={5} columns={4} />
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

  if (!data) return null;
  const stats = data.stats;
  const users = data.users || [];

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <UsersFilterManager users={users}>
        {({ filters, setFilters, filterFn, sortFn }) => (
          <UsersExportManager users={users} filterFn={filterFn}>
            {({ handleUsersExport }) => (
              <CommonPageWrapper>
                <div className="space-y-4">
                  <UserStats
                    totalUsers={stats.totalUsers}
                    activeUsers={stats.activeUsers}
                    farmOwners={stats.farmOwners}
                    todayLogins={stats.todayLogins}
                    trends={{
                      userGrowth: stats.trends.userGrowth,
                      activeUsersTrend: stats.trends.userGrowth,
                      farmOwnersTrend: stats.trends.farmOwnersTrend, // 농장 소유자 트렌드 사용
                      loginsTrend: stats.trends.userGrowth,
                    }}
                  />

                  {/* 사용자 관리 섹션 */}
                  <div className="space-y-4">
                    {/* 헤더 */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                          <Users className="h-5 w-5" />
                          {LABELS.USER_MANAGEMENT}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {LABELS.USER_MANAGEMENT_DESC}
                        </p>
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                        <div className="text-sm text-muted-foreground">
                          {LABELS.LAST_UPDATE_TAB.replace(
                            "{datetime}",
                            formatDateTime(new Date(dataUpdatedAt))
                          )}
                        </div>
                        <UsersExportRefactored
                          users={users.filter(filterFn)}
                          onExport={handleUsersExport}
                        />
                      </div>
                    </div>

                    {/* 필터 */}
                    <UserFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                    />

                    {/* 사용자 목록 (페이징 적용) */}
                    <ResponsivePagination
                      data={users}
                      itemsPerPage={20} // 데스크톱 기준 20개
                      filterFn={filterFn}
                      sortFn={sortFn}
                    >
                      {({ paginatedData, totalItems }) => (
                        <>
                          {/* 결과 요약 카드 - 모바일 가독성 개선 */}
                          <CommonResultsSummary
                            totalItems={totalItems}
                            displayedItems={paginatedData.length}
                            summaryText={LABELS.TOTAL_USERS_COUNT_TAB}
                          />

                          {/* 사용자 목록 */}
                          <UserList users={paginatedData} />
                        </>
                      )}
                    </ResponsivePagination>
                  </div>
                </div>
              </CommonPageWrapper>
            )}
          </UsersExportManager>
        )}
      </UsersFilterManager>
    </ErrorBoundary>
  );
}
