"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { Building2, Target } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { useAuth } from "@/components/providers/auth-provider";
import { useFarms } from "@/lib/hooks/use-farms";
import {
  VisitorVirtualizedTable,
  VisitorFilters,
  VisitorStats,
  VisitorExportRefactored,
  VisitorTable,
} from "@/components/admin/visitors";
import type { Farm } from "@/store/use-farms-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

// 새로운 Zustand Store 사용
import {
  useVisitors,
  useVisitorFiltersStore,
  type Visitor,
  useVisitorStore,
} from "@/store/use-visitor-store";
import { useVisitorActions } from "@/hooks/useVisitorActions";
import {
  calculateVisitorStats,
  calculatePurposeStats,
} from "@/lib/utils/data/common-stats";
import { generateFarmVisitorPageStats } from "@/lib/utils/data/common-stats";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import { AdminError } from "@/components/error/admin-error";
import { useMultipleLoadingTimeout } from "@/hooks/useTimeout";

export default function FarmVisitorsPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const farmId = params.farmId as string;
  const toast = useCommonToast();
  const {
    farms,
    fetchState,
    error: farmsError,
    successMessage: farmsSuccessMessage,
    clearMessages: clearFarmsMessages,
  } = useFarms(user?.id);

  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 새로운 Zustand Store 사용
  const { visitors, allVisitors, loading, error, fetchVisitors } =
    useVisitors();

  const {
    filters,
    setFilters,
    setDateRange,
    setCustomDateRange,
    resetFilters,
  } = useVisitorFiltersStore();

  const {
    reset,
    setFilters: visitorStoreSetFilters,
    fetchVisitors: visitorStoreFetchVisitors,
  } = useVisitorStore();

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

  // 공통 방문자 액션 훅 사용
  const { handleEdit, handleDelete, handleExport } = useVisitorActions({
    farms: farms.map((f) => ({
      id: f.id,
      farm_name: f.farm_name,
      description: null,
      farm_address: f.farm_address,
      farm_detailed_address: null,
      farm_type: f.farm_type || null,
      owner_id: f.owner_id,
      manager_phone: f.manager_phone || null,
      manager_name: f.manager_name || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    isAdmin: true,
    profileId: user?.id,
  });

  // 방문자 데이터 로드 함수 (useCallback으로 메모이제이션)
  const loadVisitors = useCallback(() => {
    if (farmId) {
      fetchVisitors({ farmId, includeAllFarms: false });
    }
  }, [farmId, fetchVisitors]);

  // 타임아웃 관리
  const { timeoutReached, retry } = useMultipleLoadingTimeout(
    [loading, fetchState.loading],
    loadVisitors,
    { timeout: 10000 }
  );

  // 초기화 로직 (한 번만 실행)
  useEffect(() => {
    if (!isInitialized && farmId) {
      reset();
      setFilters({ farmId });
      fetchVisitors({ farmId });
      loadVisitors();
      setIsInitialized(true);
    }
  }, [farmId, isInitialized, reset, setFilters, fetchVisitors, loadVisitors]);

  // farmId 변경 시 초기화
  useEffect(() => {
    if (isInitialized) {
      setIsInitialized(false);
      setCurrentFarm(null);
    }
  }, [farmId]);

  // 농장 정보 로드 함수 (useCallback으로 메모이제이션)
  const loadFarmInfo = useCallback(() => {
    if (farmId && farms.length > 0) {
      const farm = farms.find((f) => f.id === farmId);
      if (farm) {
        setCurrentFarm(farm);
      }
    }
  }, [farmId, farms]);

  // 농장 정보 로드 - farms가 변경될 때만 실행
  useEffect(() => {
    if (!fetchState.loading && farms.length > 0) {
      loadFarmInfo();
    }
  }, [farms, fetchState.loading, loadFarmInfo]);

  // 농장 필터 동기화 (필요한 경우에만)
  useEffect(() => {
    if (currentFarm && filters.farmId !== farmId) {
      setFilters({ farmId });
    }
  }, [currentFarm, farmId, setFilters]);

  // 통계 계산 (메모이제이션)
  const visitorStats = useMemo(() => {
    return calculateVisitorStats({ visitors: allVisitors });
  }, [allVisitors]);

  // 통계 카드용 데이터 생성 (메모이제이션)
  const statsForCards = useMemo(() => {
    return generateFarmVisitorPageStats(allVisitors, {
      showDisinfectionRate: true, // 방역 완료율 표시
    });
  }, [allVisitors]);

  // 방문 목적 TOP1 계산
  const topPurpose = useMemo(() => {
    const stats = calculatePurposeStats(allVisitors);
    return stats.length > 0 ? stats[0] : null;
  }, [allVisitors]);

  /**
   * 농장 변경 핸들러
   */
  const handleFarmChange = (newFarmId: string) => {
    if (newFarmId !== farmId) {
      router.push(`/admin/farms/${newFarmId}/visitors`);
    }
  };

  /**
   * 커스텀 날짜 초기화 핸들러
   */
  const handleClearCustomDates = () => {
    setCustomDateRange(null, null);
  };

  /**
   * 농장별 페이지용 필터 초기화 핸들러
   * 농장 필터는 유지하고 나머지만 초기화
   */
  const handleResetFilters = () => {
    setFilters({
      farmId, // 농장 필터는 유지
      searchTerm: "",
      dateRange: undefined,
      dateStart: undefined,
      dateEnd: undefined,
      disinfectionCheck: undefined,
      consentGiven: undefined,
    });
  };

  // 정렬 함수 (최신순)
  const sortFn = useMemo(() => {
    return (a: Visitor, b: Visitor) =>
      new Date(b.visit_datetime).getTime() -
      new Date(a.visit_datetime).getTime();
  }, []);

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

  if (loading || fetchState.loading || !currentFarm) {
    return (
      <div className="flex-1 flex flex-col gap-4 p-4 sm:p-6 md:p-8">
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  // farms 로딩이 완료되었지만 해당 농장을 찾을 수 없는 경우
  if (!fetchState.loading && farms.length > 0 && !currentFarm) {
    const farmExists = farms.some((f) => f.id === farmId);
    if (!farmExists) {
      throw new Error("요청하신 농장이 존재하지 않거나 접근할 수 없습니다.");
    }
  }

  return (
    <ErrorBoundary
      title="농장 출입 기록 오류"
      description="농장 출입 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex flex-1 flex-col gap-2 sm:gap-4 md:gap-6 p-1 sm:p-4 md:p-6 lg:p-8 pt-2 sm:pt-4 md:pt-6 w-full">
        <div className="min-w-0 w-full">
          <PageHeader
            title="출입 기록 관리"
            description={`${currentFarm.farm_name} 농장의 방문자 출입 기록을 조회하고 관리하세요`}
            breadcrumbs={[
              { label: "농장 관리", href: "/admin/farms", icon: Building2 },
              { label: "출입 기록" },
            ]}
            actions={
              <div className="min-w-0">
                <VisitorExportRefactored
                  farms={
                    farms.map((f) => ({
                      id: f.id,
                      farm_name: f.farm_name,
                      farm_type: f.farm_type ?? null,
                      farm_address: f.farm_address ?? "",
                      owner_id: f.owner_id ?? "",
                      description: null,
                      farm_detailed_address: null,
                      manager_phone: f.manager_phone ?? null,
                      manager_name: f.manager_name ?? null,
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })) as any
                  }
                  isAdmin={false}
                  hideFarmFilter={true}
                  onExport={handleExport}
                />
              </div>
            }
          />

          {/* 방문자 통계 */}
          <div className="min-w-0 w-full">
            <VisitorStats
              visitorStats={statsForCards}
              showFarmCount={false}
              showDisinfectionRate={true}
              topPurpose={topPurpose}
            />
          </div>

          {/* 필터 및 검색 */}
          <div className="min-w-0 w-full">
            <VisitorFilters
              searchTerm={filters.searchTerm}
              onSearchChange={(value) => setFilters({ searchTerm: value })}
              selectedFarm={filters.farmId || ""}
              onFarmChange={handleFarmChange}
              dateRange={filters.dateRange}
              onDateRangeChange={setDateRange}
              customStartDate={
                filters.dateStart ? new Date(filters.dateStart) : null
              }
              customEndDate={filters.dateEnd ? new Date(filters.dateEnd) : null}
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
              farms={farms}
              showFarmFilter={true}
              showAllOption={false}
              disableFarmRemoval={true}
              activeFiltersCount={
                (filters.searchTerm ? 1 : 0) +
                (filters.dateStart ? 1 : 0) +
                (filters.dateEnd ? 1 : 0) +
                (filters.disinfectionCheck !== undefined ? 1 : 0) +
                (filters.consentGiven !== undefined ? 1 : 0)
              }
              filteredCount={visitors.length}
              totalCount={allVisitors.length}
              onClearFilters={handleResetFilters}
              onClearCustomDates={handleClearCustomDates}
            />
          </div>

          {/* 방문자 테이블 */}
          <div className="min-w-0 w-full">
            <ResponsivePagination
              data={visitors}
              itemsPerPage={20}
              sortFn={sortFn}
            >
              {({ paginatedData, isLoadingMore, hasMore }) => (
                <VisitorTable
                  visitors={paginatedData.map((visitor) => ({
                    ...visitor,
                    farms: visitor.farms || currentFarm,
                  }))}
                  showFarmColumn={false}
                  loading={loading}
                  isAdmin={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </ResponsivePagination>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
