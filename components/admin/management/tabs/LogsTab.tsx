"use client";

import React from "react";
import { useState } from "react";
import { FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminLogsQuery } from "@/lib/hooks/query/use-admin-logs-query";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";

import type { SystemLog } from "@/lib/types/system";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  LogStats,
  LogList,
  LogDetailModal,
  LogCategoryFilters,
  LogFilterStatus,
  LogManagementButtons,
  LogEmptyState,
  LogsDataManager,
  LogsFilterManager,
  LogsActionManager,
  LogsExportManager,
} from "../logs";
import { LogsExportRefactored } from "../exports";
import { CommonPageWrapper } from "../shared/CommonPageWrapper";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import { LogFilters } from "../logs";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";

export function LogsTab() {
  const { data: stats, isLoading: loading, refetch } = useAdminLogsQuery();
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

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
      <CommonPageWrapper>
        <div className="space-y-6">
          <StatsSkeleton columns={4} />
          <TableSkeleton rows={10} columns={5} />
        </div>
      </CommonPageWrapper>
    );
  }

  if (!stats) return;

  return (
    <ErrorBoundary
      title="로그 관리 오류"
      description="로그 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <LogsDataManager>
        {({ logs, isLoading, error, lastUpdate, refetch }) => (
          <LogsFilterManager logs={logs}>
            {({
              filters,
              setFilters,
              auditFilter,
              setAuditFilter,
              categoryFilter,
              setCategoryFilter,
              filteredLogs,
            }) => (
              <LogsActionManager logs={logs} refetch={refetch}>
                {({
                  handleDeleteLog,
                  handleDeleteAllLogs,
                  handleDeleteOldLogs,
                  isLoading: logsActionLoading,
                }) => (
                  <LogsExportManager logs={filteredLogs}>
                    {({ handleLogsExport }) => {
                      // 빈 데이터 상태 처리
                      const showEmptyState =
                        !isLoading && filteredLogs.length === 0;

                      // 에러 상태 처리
                      if (error) {
                        return (
                          <Alert variant="destructive">
                            <AlertDescription>
                              로그를 불러오는 중 오류가 발생했습니다: {error}
                            </AlertDescription>
                          </Alert>
                        );
                      }

                      // 로딩 상태 처리
                      if (isLoading) {
                        return (
                          <CommonPageWrapper>
                            <div className="space-y-4">
                              <Skeleton className="h-8 w-full" />
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <Skeleton key={i} className="h-24 w-full" />
                                ))}
                              </div>
                              <Skeleton className="h-64 w-full" />
                            </div>
                          </CommonPageWrapper>
                        );
                      }

                      return (
                        <CommonPageWrapper>
                          <div className="space-y-2 sm:space-y-4">
                            <LogStats stats={stats} />

                            {/* 로그 관리 섹션 */}
                            <div className="space-y-4">
                              {/* 헤더 */}
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-3">
                                <div>
                                  <h3 className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg font-semibold">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                                    시스템 로그
                                  </h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                                    시스템의 모든 활동과 이벤트를 확인하고
                                    관리합니다
                                  </p>
                                </div>
                                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4">
                                  <div className="text-xs sm:text-sm text-muted-foreground">
                                    마지막 업데이트:{" "}
                                    {formatDateTime(lastUpdate)}
                                  </div>
                                  <LogsExportRefactored
                                    logs={filteredLogs}
                                    onExport={handleLogsExport}
                                  />
                                </div>
                              </div>

                              {/* 필터들 */}
                              <div className="space-y-2 sm:space-y-4">
                                <LogFilters
                                  filters={filters}
                                  onFiltersChange={setFilters}
                                />
                                <LogCategoryFilters
                                  auditFilter={auditFilter}
                                  categoryFilter={categoryFilter}
                                  onAuditFilterChange={setAuditFilter}
                                  onCategoryFilterChange={setCategoryFilter}
                                />
                                <LogFilterStatus
                                  totalCount={logs.length}
                                  filteredCount={filteredLogs.length}
                                  auditFilter={auditFilter}
                                  categoryFilter={categoryFilter}
                                />
                              </div>

                              {/* 관리 버튼 */}
                              <LogManagementButtons
                                logsCount={logs.length}
                                onDeleteOldLogs={handleDeleteOldLogs}
                                onDeleteAllLogs={handleDeleteAllLogs}
                                isLoading={logsActionLoading}
                              />

                              {/* 로그 목록 */}
                              {showEmptyState ? (
                                <LogEmptyState filters={filters} />
                              ) : (
                                <ResponsivePagination
                                  data={filteredLogs}
                                  itemsPerPage={30} // 데스크톱 기준 30개 (로그는 더 많이 표시)
                                >
                                  {({
                                    paginatedData,
                                    totalItems,
                                    isLoadingMore,
                                    hasMore,
                                  }) => (
                                    <>
                                      {/* 로그 수 표시 */}
                                      <div className="text-sm text-muted-foreground">
                                        총 {totalItems}개의 로그 (최근 5,000개
                                        중)
                                      </div>

                                      {/* 로그 목록 */}
                                      <LogList
                                        logs={paginatedData}
                                        onShowDetails={(log) =>
                                          setSelectedLog(log)
                                        }
                                        onDeleteLog={handleDeleteLog}
                                      />
                                    </>
                                  )}
                                </ResponsivePagination>
                              )}
                            </div>
                          </div>
                          <LogDetailModal
                            log={selectedLog}
                            isOpen={!!selectedLog}
                            onClose={() => setSelectedLog(null)}
                          />
                        </CommonPageWrapper>
                      );
                    }}
                  </LogsExportManager>
                )}
              </LogsActionManager>
            )}
          </LogsFilterManager>
        )}
      </LogsDataManager>
    </ErrorBoundary>
  );
}
