"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout";
import { useAuth } from "@/components/providers/auth-provider";
import {
  VisitorFilters,
  VisitorStats,
  VisitorExportRefactored,
  VisitorTableSheet,
} from "@/components/admin/visitors";
import type { Farm } from "@/lib/types/common";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { AccessDenied } from "@/components/error/access-denied";
import { AdminError } from "@/components/error/admin-error";
import { PAGE_HEADER } from "@/lib/constants/farms";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { Users } from "lucide-react";

// Zustand Store 사용
import { useVisitorFiltersStore } from "@/store/use-visitor-filters-store";
import { useVisitorActions } from "@/hooks/visitor/useVisitorActions";
import { generateFarmVisitorPageStats } from "@/lib/utils/data/common-stats";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ResponsivePagination } from "@/components/ui/responsive-pagination";

// React Query Hooks
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useFarmVisitorsWithFiltersQuery } from "@/lib/hooks/query/use-farm-visitors-filtered-query";

export default function FarmVisitorsPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const farmId = (params as any).farmId as string; // useParams()는 항상 객체 반환
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
  const allowedDateRanges = ["today", "all", "custom", "week", "month"];
  const visitorsFilteredQuery = useFarmVisitorsWithFiltersQuery({
    farmId: farmId,
    searchTerm: filters.searchTerm || "",
    dateRange: allowedDateRanges.includes(filters.dateRange)
      ? (filters.dateRange as "today" | "all" | "custom" | "week" | "month")
      : "all",
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
      showError("오류", error.message);
    }
  }, [error, showError]);

  // 방문자 액션 훅
  const { handleEdit, handleDelete, handleExport } = useVisitorActions({
    farms: farms, // map 변환 없이 그대로 전달
    isAdmin: false,
    profileId: userId,
    allVisitors: allVisitors, // map 변환 없이 그대로 전달
  });

  // 농장 정보 로드
  useEffect(() => {
    if (farms.length > 0 && !isInitialized) {
      const farm = farms.find((f) => f.id === farmId);
      if (farm) {
        setCurrentFarm(farm);
        setIsInitialized(true);
      } else {
        showError(
          "농장을 찾을 수 없습니다",
          "요청하신 농장이 존재하지 않거나 접근할 수 없습니다."
        );
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
        <PageHeader
          title={PAGE_HEADER.FARM_VISITORS_PAGE_TITLE}
          description={PAGE_HEADER.FARM_VISITORS_PAGE_DESCRIPTION}
        />
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  if (!currentFarm) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
        <AdminError
          title={ERROR_CONFIGS.LOADING.title}
          description={ERROR_CONFIGS.LOADING.description}
          error={new Error("Farm not found")}
          reset={() => router.push("/admin/farms")}
          isNotFound={true}
        />
      </div>
    );
  }

  // 농장 접근 권한 확인
  if (!farms.some((f) => f.id === farmId)) {
    return (
      <AccessDenied
        title={ERROR_CONFIGS.PERMISSION.title}
        description={ERROR_CONFIGS.PERMISSION.description}
        requiredRole="농장 소유자 또는 관리자"
        currentRole="일반 사용자"
      />
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={PAGE_HEADER.FARM_VISITORS_TITLE.replace(
            "{farmName}",
            currentFarm.farm_name
          )}
          description={PAGE_HEADER.FARM_VISITORS_DETAILED_DESCRIPTION.replace(
            "{farmName}",
            currentFarm.farm_name
          )}
          icon={Users}
          actions={
            <VisitorExportRefactored
              farms={farms} // map 변환 없이 그대로 전달
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
        />

        {/* 방문자 테이블 (페이징 적용) */}
        <ResponsivePagination
          data={visitors}
          itemsPerPage={20} // 데스크톱 기준 20개
          sortFn={sortFn}
        >
          {({ paginatedData, isLoadingMore, hasMore }) => (
            <VisitorTableSheet
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
