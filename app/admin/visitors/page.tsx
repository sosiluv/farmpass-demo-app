"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import {
  useVisitors,
  useVisitorFiltersStore,
  useVisitorStore,
} from "@/store/use-visitor-store";
import type { Farm } from "@/lib/types/visitor";
import { useFarms } from "@/lib/hooks/use-farms";
import {
  VisitorTable,
  VisitorFilters,
  VisitorStats,
  VisitorExportRefactored,
} from "@/components/admin/visitors";
import { PageHeader } from "@/components/layout";
import { useMemo, useEffect, useCallback } from "react";
import { useVisitorActions } from "@/hooks/useVisitorActions";
import { calculateVisitorStats } from "@/lib/utils/data/common-stats";
import { generateVisitorPageStats } from "@/lib/utils/data/common-stats";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

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
  const profile = state.status === "authenticated" ? state.profile : null;
  const isAdmin = profile?.account_type === "admin";
  const toast = useCommonToast();

  // Store에서 데이터와 액션 가져오기
  const { visitors, allVisitors, loading, error, fetchVisitors } =
    useVisitors();

  // 농장 데이터 가져오기
  const {
    farms: rawFarms,
    error: farmsError,
    successMessage: farmsSuccessMessage,
    clearMessages: clearFarmsMessages,
  } = useFarms(profile?.id);

  // Farm 타입 변환 (메모이제이션 최적화)
  const farms: Farm[] = useMemo(() => {
    if (!rawFarms || rawFarms.length === 0) return [];

    return rawFarms.map((farm) => ({
      id: farm.id,
      farm_name: farm.farm_name,
      farm_type: farm.farm_type || undefined,
      farm_address: farm.farm_address,
      owner_id: farm.owner_id,
    }));
  }, [rawFarms]);

  // 필터 Store
  const {
    filters,
    setFilters,
    setDateRange,
    setCustomDateRange,
    resetFilters,
  } = useVisitorFiltersStore();

  const { reset } = useVisitorStore();

  // 농장 관련 토스트 처리
  useEffect(() => {
    if (farmsError) {
      toast.showCustomError("오류", farmsError);
      clearFarmsMessages();
    }
  }, [farmsError, toast, clearFarmsMessages]);

  useEffect(() => {
    if (farmsSuccessMessage) {
      toast.showCustomSuccess("성공", farmsSuccessMessage);
      clearFarmsMessages();
    }
  }, [farmsSuccessMessage, toast, clearFarmsMessages]);

  /**
   * 커스텀 날짜 초기화 핸들러
   */
  const handleClearCustomDates = () => {
    setCustomDateRange(null, null);
  };

  // 공통 방문자 액션 훅 사용
  const { handleEdit, handleDelete, handleExport } = useVisitorActions({
    farms: farms.map((farm) => ({
      id: farm.id,
      farm_name: farm.farm_name,
      description: null,
      farm_address: farm.farm_address || "",
      farm_detailed_address: null,
      farm_type: farm.farm_type || null,
      owner_id: farm.owner_id || "",
      manager_phone: null,
      manager_name: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    isAdmin,
    profileId: profile?.id,
  });

  // 방문자 데이터 로드 함수 (useCallback으로 메모이제이션)
  const loadVisitors = useCallback(() => {
    if (profile?.id) {
      fetchVisitors({ includeAllFarms: isAdmin });
    }
  }, [fetchVisitors, isAdmin, profile?.id]);

  // 컴포넌트 마운트 시 데이터 로드 (의존성 최적화)
  useEffect(() => {
    reset();
    loadVisitors();
  }, [reset, loadVisitors]);

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(loading, loadVisitors, {
    timeout: 10000,
  });

  // 통계 계산 (메모이제이션)
  const visitorStats = useMemo(() => {
    return calculateVisitorStats({ visitors: allVisitors });
  }, [allVisitors]);

  // 통계 카드용 데이터 생성 (메모이제이션)
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

  // 필터 카운트 계산 (메모이제이션)
  const activeFiltersCount = useMemo(() => {
    return (
      (filters.searchTerm ? 1 : 0) +
      (filters.farmId ? 1 : 0) +
      (filters.dateStart ? 1 : 0) +
      (filters.dateEnd ? 1 : 0) +
      (filters.disinfectionCheck !== undefined ? 1 : 0) +
      (filters.consentGiven !== undefined ? 1 : 0)
    );
  }, [
    filters.searchTerm,
    filters.farmId,
    filters.dateStart,
    filters.dateEnd,
    filters.disinfectionCheck,
    filters.consentGiven,
  ]);

  if (timeoutReached) {
    toast.showWarning(
      "데이터 로딩 지연",
      "네트워크 상태를 확인하거나 다시 시도해 주세요."
    );
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
      <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="방문자 기록 오류"
      description="방문자 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-1 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6">
        <PageHeader
          title={isAdmin ? "전체 방문자 기록" : "방문자 기록"}
          description={
            isAdmin
              ? "모든 농장의 방문자 기록을 조회하고 관리합니다."
              : "내 농장의 방문자 기록을 조회하고 관리합니다."
          }
          breadcrumbs={[
            { label: isAdmin ? "전체 방문자 기록" : "방문자 기록" },
          ]}
          actions={
            <VisitorExportRefactored
              farms={farms.map((farm) => ({
                id: farm.id,
                farm_name: farm.farm_name,
                farm_type: farm.farm_type || null,
                farm_address: farm.farm_address || "",
                owner_id: farm.owner_id || "",
                description: null,
                farm_detailed_address: null,
                manager_phone: null,
                manager_name: null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }))}
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
          showAllOption={isAdmin}
          isAdmin={isAdmin}
        />

        {/* 방문자 목록 */}
        {/* <VisitorVirtualizedTable
          visitors={visitors}
          farms={farms}
          sortFn={sortFn}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        /> */}

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
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </ResponsivePagination>
      </div>
    </ErrorBoundary>
  );
}
