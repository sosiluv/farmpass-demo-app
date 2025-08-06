"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { useVisitorFiltersStore } from "@/lib/hooks/query/use-visitor-filters";
import {
  VisitorTable,
  VisitorFilters,
  VisitorStats,
  VisitorExportRefactored,
} from "@/components/admin/visitors";
import { PageHeader } from "@/components/layout";
import { useMemo, useEffect } from "react";
import { useVisitorActions } from "@/hooks/visitor/useVisitorActions";
import { generateVisitorPageStats } from "@/lib/utils/data/common-stats";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { PAGE_HEADER } from "@/lib/constants/visitor";
import { Users } from "lucide-react";

// React Query Hooks
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useFarmVisitorsWithFiltersQuery } from "@/lib/hooks/query/use-farm-visitors-filtered-query";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

/**
 * 방문자 기록 조회 페이지
 *
 * 사용자가 접근 가능한 농장의 방문자 기록을 표시하고,
 * 농장별 필터링, 검색, 기간 선택 기능을 제공합니다.
 * - Admin: 모든 농장 접근 가능
 * - 일반 사용자: 소유/관리하는 농장만 접근 가능
 */
export default function VisitorsPage() {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);
  const isAdmin = profile?.account_type === "admin";
  const { showError } = useCommonToast();

  // React Query Hooks - useFarmsContext 대신 useFarmsQuery 사용
  const {
    farms,
    isLoading: farmsLoading,
    error: farmsError,
  } = useFarmsQuery(profile?.id);

  // 필터 Store
  const {
    filters,
    setFilters,
    setDateRange,
    setCustomDateRange,
    resetFilters,
  } = useVisitorFiltersStore();

  // React Query 필터링 Hook
  const visitorsFilteredQuery = useFarmVisitorsWithFiltersQuery({
    farmId: filters.farmId || undefined,
    searchTerm: filters.searchTerm || "",
    dateRange:
      (filters.dateRange as "custom" | "all" | "today" | "week" | "month") ||
      "all",
    dateStart: filters.dateStart || undefined,
    dateEnd: filters.dateEnd || undefined,
  });

  // 데이터 선택
  const visitors = visitorsFilteredQuery.visitors || [];
  const allVisitors = visitorsFilteredQuery.allVisitors || [];
  const loading = visitorsFilteredQuery.loading || farmsLoading;
  const error = visitorsFilteredQuery.error || farmsError;

  // 에러 처리
  useEffect(() => {
    if (error) {
      showError("오류", error.message);
    }
  }, [error, showError]);

  /**
   * 커스텀 날짜 초기화 핸들러
   */
  const handleClearCustomDates = () => {
    setCustomDateRange(null, null);
  };

  // 공통 방문자 액션 훅 사용
  const { handleEdit, handleDelete, handleExport } = useVisitorActions({
    farms: farms, // 변환 없이 그대로 전달
    isAdmin,
    profileId: profile?.id,
    allVisitors: allVisitors,
  });

  // 통계 계산
  const statsForCards = useMemo(() => {
    return generateVisitorPageStats(allVisitors, {
      showFarmCount: true,
      showDisinfectionRate: true,
      totalFarms: farms.length,
    });
  }, [allVisitors, farms.length]);

  // 정렬 함수 (최신순)
  const sortFn = useMemo(() => {
    return (a: any, b: any) =>
      new Date(b.visit_datetime).getTime() -
      new Date(a.visit_datetime).getTime();
  }, []);

  // 필터 카운트 계산
  const activeFiltersCount = useMemo(() => {
    return (
      (filters.searchTerm ? 1 : 0) +
      (filters.farmId ? 1 : 0) +
      (filters.dateStart ? 1 : 0) +
      (filters.dateEnd ? 1 : 0)
    );
  }, [filters.searchTerm, filters.farmId, filters.dateStart, filters.dateEnd]);

  if (loading) {
    return (
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-1 sm:p-4 md:p-6 lg:p-8">
        <PageHeader
          title={
            isAdmin
              ? PAGE_HEADER.ALL_VISITORS_PAGE_TITLE
              : PAGE_HEADER.VISITORS_PAGE_TITLE
          }
          description={
            isAdmin
              ? PAGE_HEADER.ALL_VISITORS_PAGE_DESCRIPTION
              : PAGE_HEADER.VISITORS_PAGE_DESCRIPTION
          }
          icon={Users}
        />
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={
            isAdmin
              ? PAGE_HEADER.ALL_VISITORS_PAGE_TITLE
              : PAGE_HEADER.VISITORS_PAGE_TITLE
          }
          description={
            isAdmin
              ? PAGE_HEADER.ALL_VISITORS_PAGE_DESCRIPTION
              : PAGE_HEADER.VISITORS_PAGE_DESCRIPTION
          }
          icon={Users}
          actions={
            <VisitorExportRefactored
              farms={farms} // 변환 없이 그대로 전달
              isAdmin={isAdmin}
              onExport={handleExport}
            />
          }
        />

        {/* 통계 */}
        <VisitorStats
          visitorStats={statsForCards}
          showFarmCount={true}
          showDisinfectionRate={true}
        />

        {/* 필터 */}
        <VisitorFilters
          searchTerm={filters.searchTerm}
          selectedFarm={filters.farmId || ""}
          dateRange={filters.dateRange}
          customStartDate={
            filters.dateStart ? new Date(filters.dateStart) : null
          }
          customEndDate={filters.dateEnd ? new Date(filters.dateEnd) : null}
          onSearchChange={(value) => setFilters({ searchTerm: value })}
          onFarmChange={(value) =>
            setFilters({
              farmId: value === "all" || value === "" ? "" : value,
            })
          }
          onDateRangeChange={setDateRange}
          onCustomStartDateChange={(date) => {
            const currentEnd = filters.dateEnd
              ? new Date(filters.dateEnd)
              : null;
            setCustomDateRange(date, currentEnd);
          }}
          onCustomEndDateChange={(date) => {
            const currentStart = filters.dateStart
              ? new Date(filters.dateStart)
              : null;
            setCustomDateRange(currentStart, date);
          }}
          onClearCustomDates={handleClearCustomDates}
          farms={farms}
          activeFiltersCount={activeFiltersCount}
          filteredCount={visitors.length}
          totalCount={allVisitors.length}
          onClearFilters={resetFilters}
          showFarmFilter={true}
          showAllOption={true}
          isAdmin={isAdmin}
        />

        {/* 방문자 테이블 (페이징 적용) */}
        <ResponsivePagination
          data={visitors}
          itemsPerPage={20} // 데스크톱 기준 20개
          sortFn={sortFn}
        >
          {({ paginatedData, isLoadingMore, hasMore }) => (
            <VisitorTable
              visitors={paginatedData}
              showFarmColumn={isAdmin || farms.length > 1} // 관리자이거나 농장이 여러 개인 경우 농장 컬럼 표시
              loading={loading}
              isAdmin={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </ResponsivePagination>
      </div>
    </ErrorBoundary>
  );
}
