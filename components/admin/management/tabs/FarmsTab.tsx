"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { useAdminFarmsQuery } from "@/lib/hooks/query/use-admin-farms-query";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  FarmStats,
  FarmList,
  FarmFilters,
  FarmsFilterManager,
  FarmsExportManager,
} from "../farms";
import { FarmsExportRefactored } from "../exports";
import { CommonPageWrapper, CommonResultsSummary } from "../shared";
import { ResponsivePagination } from "@/components/ui/responsive-pagination";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/system/useTimeout";
import { LABELS } from "@/lib/constants/management";

export function FarmsTab() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
    dataUpdatedAt,
  } = useAdminFarmsQuery();

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
          <TableSkeleton rows={5} columns={6} />
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
  const farms = data.farms || [];

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <FarmsFilterManager farms={farms}>
        {({ filters, setFilters, filterFn, sortFn }) => (
          <FarmsExportManager farms={farms} filterFn={filterFn}>
            {({ handleFarmsExport }) => (
              <CommonPageWrapper>
                <div className="space-y-4">
                  <FarmStats
                    totalFarms={stats.totalFarms}
                    totalOwners={stats.totalOwners}
                    totalRegions={stats.totalRegions}
                    monthlyRegistrations={stats.monthlyRegistrations}
                    trends={{
                      farmGrowth: stats.trends.farmGrowth,
                      farmOwnersTrend: stats.trends.farmOwnersTrend,
                      registrationTrend: stats.trends.registrationTrend,
                    }}
                  />

                  {/* 농장 관리 섹션 */}
                  <div className="space-y-4">
                    {/* 헤더 */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                          <Building2 className="h-5 w-5" />
                          {LABELS.FARM_MANAGEMENT}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {LABELS.FARM_MANAGEMENT_DESC}
                        </p>
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                        <div className="text-sm text-muted-foreground">
                          {LABELS.LAST_UPDATE_TAB.replace(
                            "{datetime}",
                            formatDateTime(new Date(dataUpdatedAt))
                          )}
                        </div>
                        <FarmsExportRefactored
                          farms={farms.filter(filterFn)}
                          onExport={handleFarmsExport}
                        />
                      </div>
                    </div>

                    {/* 필터 */}
                    <FarmFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                    />

                    {/* 농장 목록 (페이징 적용) */}
                    <ResponsivePagination
                      data={farms}
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
                            summaryText={LABELS.TOTAL_FARMS_COUNT_TAB}
                          />

                          {/* 농장 목록 */}
                          <FarmList farms={paginatedData} />
                        </>
                      )}
                    </ResponsivePagination>
                  </div>
                </div>
              </CommonPageWrapper>
            )}
          </FarmsExportManager>
        )}
      </FarmsFilterManager>
    </ErrorBoundary>
  );
}
