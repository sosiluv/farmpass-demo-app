"use client";

import React from "react";
import { Users } from "lucide-react";
import { useAdminUsersQuery } from "@/lib/hooks/query/use-admin-users-query";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  UserStats,
  UserList,
  UserFilters,
  UsersDataManager,
  UsersFilterManager,
  UsersExportManager,
} from "../users";
import { UsersExportRefactored } from "../exports";
import { CommonPageWrapper } from "../shared/CommonPageWrapper";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/system/useTimeout";
import { LABELS } from "@/lib/constants/management";

export function UsersTab() {
  const { data: stats, isLoading: loading, refetch } = useAdminUsersQuery();

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

  if (!stats) return;

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <UsersDataManager>
        {({ users, lastUpdate }) => (
          <UsersFilterManager users={users}>
            {({ filters, setFilters, filterFn, sortFn }) => (
              <UsersExportManager users={users} filterFn={filterFn}>
                {({ handleUsersExport }) => (
                  <CommonPageWrapper>
                    <div className="space-y-2 sm:space-y-4">
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
                                formatDateTime(lastUpdate)
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
                          {({
                            paginatedData,
                            totalItems,
                            isLoadingMore,
                            hasMore,
                          }) => (
                            <>
                              {/* 결과 요약 카드 - 모바일 가독성 개선 */}
                              <div className="bg-card border rounded-lg p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-sm sm:text-base font-medium text-foreground">
                                      {LABELS.TOTAL_USERS_COUNT_TAB.replace(
                                        "{count}",
                                        totalItems.toString()
                                      )}
                                    </span>
                                  </div>
                                  {totalItems > 0 && (
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                      {paginatedData.length}개 표시 중
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 사용자 목록 */}
                              <UserList
                                users={paginatedData}
                                onUserClick={(user) => {
                                  // 사용자 클릭 시 처리 로직
                                  devLog.log("User clicked:", user);
                                }}
                              />
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
        )}
      </UsersDataManager>
    </ErrorBoundary>
  );
}
