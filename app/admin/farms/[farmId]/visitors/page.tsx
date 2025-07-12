"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { PageHeader } from "@/components/layout";
import { useAuth } from "@/components/providers/auth-provider";
import {
  VisitorFilters,
  VisitorStats,
  VisitorExportRefactored,
  VisitorTable,
} from "@/components/admin/visitors";
import type { Farm } from "@/lib/types/farm";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { AccessDenied } from "@/components/error/access-denied";

// Zustand Store 사용
import { useVisitorFiltersStore } from "@/lib/hooks/query/use-visitor-filters";
import { useVisitorActions } from "@/hooks/useVisitorActions";
import { generateFarmVisitorPageStats } from "@/lib/utils/data/common-stats";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ResponsivePagination } from "@/components/common/responsive-pagination";

// React Query Hooks
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useFarmVisitorsWithFiltersQuery } from "@/lib/hooks/query/use-farm-visitors-filtered-query";

export default function FarmVisitorsPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const farmId = params.farmId as string;
  const { showError } = useCommonToast();

  // React Query Hooks
  const farmsQuery = useFarmsQuery();

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
    farmId: farmId,
    searchTerm: filters.searchTerm || "",
    dateRange: filters.dateRange || "all",
    dateStart: filters.dateStart || undefined,
    dateEnd: filters.dateEnd || undefined,
  });

  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 데이터 선택
  const farms = farmsQuery.farms || [];
  const visitors = visitorsFilteredQuery.visitors || [];
  const allVisitors = visitorsFilteredQuery.allVisitors || [];
  const topPurpose = visitorsFilteredQuery.topPurpose;
  const loading = visitorsFilteredQuery.loading || farmsQuery.loading;
  const error = visitorsFilteredQuery.error || farmsQuery.error;

  // 에러 처리
  useEffect(() => {
    if (error) {
      const authError = getAuthErrorMessage(error);
      showError("오류", authError.message);
    }
  }, [error, showError]);

  // 방문자 액션 훅
  const { handleEdit, handleDelete, handleExport } = useVisitorActions({
    farms: farms.map((f) => ({
      id: f.id,
      farm_name: f.farm_name,
      description: f.description,
      farm_address: f.farm_address,
      farm_detailed_address: f.farm_detailed_address,
      farm_type: f.farm_type,
      owner_id: f.owner_id,
      manager_phone: f.manager_phone,
      manager_name: f.manager_name,
      is_active: f.is_active,
      created_at: f.created_at,
      updated_at: f.updated_at,
    })),
    isAdmin: false,
    profileId: user?.id,
    allVisitors: allVisitors.map((v) => ({
      ...v,
      registered_by: v.registered_by || undefined,
    })),
  });

  // 농장 정보 로드
  useEffect(() => {
    if (farms.length > 0 && !isInitialized) {
      const farm = farms.find((f) => f.id === farmId);
      if (farm) {
        setCurrentFarm(farm);
        setIsInitialized(true);
      } else {
        const authError = getAuthErrorMessage("FARM_NOT_FOUND");
        showError("농장을 찾을 수 없습니다", authError.message);
        router.push("/admin/farms");
      }
    }
  }, [farms, farmId, isInitialized, showError, router]);

  // 통계 계산
  const visitorStats = useMemo(() => {
    return generateFarmVisitorPageStats(allVisitors, {
      showDisinfectionRate: true,
    });
  }, [allVisitors]);

  // 커스텀 날짜 초기화 핸들러
  const handleClearCustomDates = () => {
    setCustomDateRange(null, null);
  };

  // 농장 변경 핸들러
  const handleFarmChange = (farmId: string) => {
    if (farmId === "all" || farmId === "") {
      router.push("/admin/visitors");
    } else {
      router.push(`/admin/farms/${farmId}/visitors`);
    }
  };

  // 정렬 함수
  const sortFn = useMemo(() => {
    return (a: any, b: any) =>
      new Date(b.visit_datetime).getTime() -
      new Date(a.visit_datetime).getTime();
  }, []);

  // 필터 카운트 계산
  const activeFiltersCount = useMemo(() => {
    return (
      (filters.searchTerm ? 1 : 0) +
      (filters.dateStart ? 1 : 0) +
      (filters.dateEnd ? 1 : 0)
    );
  }, [filters.searchTerm, filters.dateStart, filters.dateEnd]);

  // 로딩 상태는 기존 스켈레톤 유지 (일관성)
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            농장을 찾을 수 없습니다
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            요청하신 농장이 존재하지 않거나 접근 권한이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  // 농장 접근 권한 확인
  if (!farms.some((f) => f.id === farmId)) {
    return (
      <AccessDenied
        title="농장 접근 권한이 없습니다"
        description="이 농장에 대한 접근 권한이 없습니다. 농장 소유자나 관리자에게 문의하세요."
        requiredRole="농장 소유자 또는 관리자"
        currentRole="일반 사용자"
      />
    );
  }

  return (
    <ErrorBoundary
      title="농장 방문자 기록 오류"
      description="농장 방문자 정보를 불러오는 중 문제가 발생했습니다."
    >
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-1 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6">
        <PageHeader
          title={`${currentFarm.farm_name} 방문자 기록`}
          description={`${currentFarm.farm_name}의 방문자 기록을 조회하고 관리합니다.`}
          breadcrumbs={[
            { label: "농장 관리", href: "/admin/farms" },
            { label: currentFarm.farm_name, href: `/admin/farms/${farmId}` },
            { label: "방문자 기록" },
          ]}
          actions={
            <VisitorExportRefactored
              farms={farms.map((f) => ({
                id: f.id,
                farm_name: f.farm_name,
                farm_type: f.farm_type,
                farm_address: f.farm_address,
                owner_id: f.owner_id,
                description: f.description,
                farm_detailed_address: f.farm_detailed_address,
                manager_phone: f.manager_phone,
                manager_name: f.manager_name,
                is_active: f.is_active,
                created_at: f.created_at,
                updated_at: f.updated_at,
              }))}
              isAdmin={false}
              onExport={handleExport}
            />
          }
        />

        {/* 통계 */}
        <VisitorStats
          visitorStats={visitorStats}
          showFarmCount={false}
          showDisinfectionRate={true}
          topPurpose={topPurpose}
        />

        {/* 필터 */}
        <VisitorFilters
          searchTerm={filters.searchTerm}
          selectedFarm={farmId}
          dateRange={filters.dateRange}
          customStartDate={
            filters.dateStart ? new Date(filters.dateStart) : null
          }
          customEndDate={filters.dateEnd ? new Date(filters.dateEnd) : null}
          onSearchChange={(value) => setFilters({ searchTerm: value })}
          onFarmChange={handleFarmChange}
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
          showAllOption={false}
          isAdmin={false}
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
              showFarmColumn={false}
              loading={loading}
              isAdmin={false}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </ResponsivePagination>
      </div>
    </ErrorBoundary>
  );
}
