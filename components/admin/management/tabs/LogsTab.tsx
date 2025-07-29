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
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";
import { LABELS } from "@/lib/constants/management";

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
          <TableSkeleton rows={10} columns={5} />
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
      <LogsDataManager>
        {({ logs, isLoading, error, lastUpdate, refetch }) => (
          <LogsFilterManager logs={logs}>
            {({
              filters,
              setFilters,
              categoryFilters,
              setCategoryFilters,
              levelFilters,
              setLevelFilters,
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
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div>
                                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                                    <FileText className="h-5 w-5" />
                                    {LABELS.SYSTEM_LOGS_TAB}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {LABELS.SYSTEM_LOGS_TAB_DESC}
                                  </p>
                                </div>
                                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                                  <div className="text-sm text-muted-foreground">
                                    {LABELS.LAST_UPDATE_TAB.replace(
                                      "{datetime}",
                                      formatDateTime(lastUpdate)
                                    )}
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
                                  levelFilters={levelFilters}
                                  onLevelFiltersChange={setLevelFilters}
                                  onCategoryFiltersChange={setCategoryFilters}
                                />
                                <LogCategoryFilters
                                  categoryFilters={categoryFilters}
                                  onCategoryFiltersChange={setCategoryFilters}
                                />
                                <LogFilterStatus
                                  totalCount={logs.length}
                                  filteredCount={filteredLogs.length}
                                  categoryFilters={categoryFilters}
                                  filters={filters}
                                  levelFilters={levelFilters}
                                  onClearAllFilters={() => {
                                    setFilters({
                                      search: "",
                                      level: undefined,
                                      startDate: undefined,
                                      endDate: undefined,
                                    });
                                    setLevelFilters(["all"]);
                                    setCategoryFilters(["all"]);
                                  }}
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
                                        {LABELS.TOTAL_LOGS_COUNT.replace(
                                          "{count}",
                                          totalItems.toString()
                                        )}
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
