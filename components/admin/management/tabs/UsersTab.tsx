"use client";

import React from "react";
import { Users } from "lucide-react";
import { useAdminUsersQueryCompat } from "@/lib/hooks/query/use-admin-users-query";
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
import { useDataFetchTimeout } from "@/hooks/useTimeout";

export function UsersTab() {
  const { stats, loading, refetch } = useAdminUsersQueryCompat();

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(loading, async () => {
    await refetch();
  }, {
    timeout: 10000,
  });

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
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  if (!stats) return;

  return (
    <ErrorBoundary
      title="사용자 관리 오류"
      description="사용자 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
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
                              사용자 관리
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              시스템에 등록된 모든 사용자를 관리합니다
                            </p>
                          </div>
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                            <div className="text-sm text-muted-foreground">
                              마지막 업데이트: {formatDateTime(lastUpdate)}
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
                              {/* 사용자 수 표시 */}
                              <div className="text-sm text-muted-foreground">
                                총 {totalItems}명의 사용자
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
