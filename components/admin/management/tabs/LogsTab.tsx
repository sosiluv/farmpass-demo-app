"use client";

import React from "react";
import { useState } from "react";
import { FileText } from "lucide-react";
// Removed inline error/loading UI handled by LogsDataManager
import { useAdminLogsQuery } from "@/lib/hooks/query/use-admin-logs-query";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

import type { SystemLog } from "@/lib/types/common";
import { formatInTimeZone } from "date-fns-tz";
import {
  LogStats,
  LogList,
  LogDetailSheet,
  LogCategoryFilters,
  LogFilterStatus,
  LogManagementButtons,
  LogEmptyState,
  LogsFilterManager,
  LogsActionManager,
  LogsExportManager,
} from "../logs";
import { LogsExportRefactored } from "../exports";
import { CommonPageWrapper, CommonResultsSummary } from "../shared";
import { ResponsivePagination } from "@/components/ui/responsive-pagination";
import { LogFilters } from "../logs";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/system/useTimeout";
import { LABELS } from "@/lib/constants/management";
import { formatDateTime } from "@/lib/utils/datetime/date";

export function LogsTab() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminLogsQuery();
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
        isTimeout={true}
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
  const logs = (data as any).logs as SystemLog[];

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
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
                  const showEmptyState = filteredLogs.length === 0;

                  return (
                    <CommonPageWrapper>
                      <div className="space-y-4">
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
                                  formatDateTime(new Date(dataUpdatedAt))
                                )}
                              </div>
                              <LogsExportRefactored
                                logs={filteredLogs}
                                onExport={handleLogsExport}
                              />
                            </div>
                          </div>

                          {/* 필터들 */}
                          <div className="space-y-4">
                            <LogFilters
                              filters={filters}
                              onFiltersChange={setFilters}
                              levelFilters={levelFilters}
                              onLevelFiltersChange={setLevelFilters}
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
                              itemsPerPage={30}
                            >
                              {({ paginatedData, totalItems }) => (
                                <>
                                  <CommonResultsSummary
                                    totalItems={totalItems}
                                    displayedItems={paginatedData.length}
                                    summaryText={LABELS.TOTAL_LOGS_COUNT}
                                  />
                                  <LogList
                                    logs={paginatedData}
                                    onShowDetails={(log) => setSelectedLog(log)}
                                    onDeleteLog={handleDeleteLog}
                                  />
                                </>
                              )}
                            </ResponsivePagination>
                          )}
                        </div>
                      </div>
                      <LogDetailSheet
                        log={selectedLog}
                        open={!!selectedLog}
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
    </ErrorBoundary>
  );
}
