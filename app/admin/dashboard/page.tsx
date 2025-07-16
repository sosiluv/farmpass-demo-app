"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/layout";
import {
  DashboardSkeleton,
  FarmSelector,
  StatsGrid,
  ChartGrid,
} from "@/components/admin/dashboard";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { BarChart3, TrendingUp } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { calculateUnifiedChartData } from "@/lib/utils/data/common-stats";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { AdminError } from "@/components/error/admin-error";
import { useMultipleLoadingTimeout } from "@/hooks/useTimeout";
import { InstallGuide } from "@/components/common/InstallGuide";
import { usePWAInstall } from "@/components/providers/pwa-provider";

// React Query Hooks (100% 마이그레이션 완료)
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useFarmVisitorsQuery } from "@/lib/hooks/query/use-farm-visitors-query";

export default function DashboardPage() {
  const { state } = useAuth();

  // React Query 100% 마이그레이션 완료 - 더 이상 Feature Flag 불필요
  const {
    farms: availableFarms,
    isLoading: farmsLoading,
    isError: farmsError,
    error: farmsErrorDetails,
    refetch: refetchFarms,
  } = useFarmsQuery();

  const installInfo = usePWAInstall();

  // state에서 profile 추출 및 admin 여부 확인 - useMemo로 최적화
  const profile = state.status === "authenticated" ? state.profile : null;
  const isAdmin = useMemo(
    () => profile?.account_type === "admin",
    [profile?.account_type]
  );
  const userLoading = state.status === "loading"; // 새로운 상태 기반 로딩 확인

  // 초기 농장 선택 - useMemo로 최적화
  const initialSelectedFarm = useMemo(() => {
    if (farmsLoading || availableFarms.length === 0) {
      return "";
    }

    if (isAdmin) {
      return "all"; // admin의 경우 기본값을 '전체 농장'으로 설정
    } else {
      return availableFarms[0]?.id || "";
    }
  }, [farmsLoading, availableFarms, isAdmin]);

  // selectedFarm 상태 관리 개선
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // 농장 선택 콜백 - useCallback으로 최적화
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarm(farmId);
  }, []);

  // 알림 권한 관리
  const { lastMessage, clearLastMessage } = useNotificationPermission();

  const { showWarning, showSuccess, showError } = useCommonToast();

  // 초기 농장 선택 설정 - 한 번만 실행
  useEffect(() => {
    if (
      !isInitialized &&
      initialSelectedFarm &&
      !farmsLoading &&
      availableFarms.length > 0
    ) {
      setSelectedFarm(initialSelectedFarm);
      setIsInitialized(true);
      devLog.log(`Initial farm selected: ${initialSelectedFarm}`);
    }
  }, [initialSelectedFarm, farmsLoading, availableFarms.length, isInitialized]);

  // 알림 메시지 처리
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "success") {
        showSuccess(lastMessage.title, lastMessage.message);
      } else {
        showError(lastMessage.title, lastMessage.message);
      }
      clearLastMessage();
    }
  }, [lastMessage, showSuccess, showError, clearLastMessage]);

  // useFarmVisitorsQuery 호출을 메모화하여 불필요한 재호출 방지
  const memoizedSelectedFarm = useMemo(() => {
    return selectedFarm === "all" ? null : selectedFarm;
  }, [selectedFarm]);

  // React Query 방문자 Hook (100% 마이그레이션 완료)
  const {
    loading: visitorsLoading,
    visitors,
    dashboardStats,
    visitorTrend,
    refetch: refetchVisitors,
  } = useFarmVisitorsQuery(memoizedSelectedFarm);

  // 통합 차트 데이터 계산 - useMemo로 최적화
  const chartData = useMemo(
    () => calculateUnifiedChartData(visitors),
    [visitors]
  );

  // 초기 로딩 상태 최적화 - 데이터가 있으면 스켈레톤 숨김
  const isInitialLoading = useMemo(() => {
    return (
      userLoading ||
      (farmsLoading && availableFarms.length === 0) ||
      (visitorsLoading &&
        selectedFarm &&
        selectedFarm !== "" &&
        visitors.length === 0)
    );
  }, [
    userLoading,
    farmsLoading,
    availableFarms.length,
    visitorsLoading,
    selectedFarm,
    visitors.length,
  ]);

  // 데이터 재페칭 함수
  const handleDataRefetch = useCallback(() => {
    refetchVisitors?.();
  }, [refetchVisitors]);

  // 다중 로딩 상태 타임아웃 관리
  const { timeoutReached, retry } = useMultipleLoadingTimeout(
    [visitorsLoading, farmsLoading],
    handleDataRefetch,
    { timeout: 10000 }
  );

  // 타임아웃 상태 변경 시 경고 메시지 표시
  useEffect(() => {
    if (timeoutReached) {
      showWarning(
        "데이터 로딩 지연",
        "네트워크 상태를 확인하거나 다시 시도해 주세요."
      );
    }
  }, [timeoutReached, showWarning]);

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

  if (isInitialLoading) {
    return (
      <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10 p-1 sm:p-6 lg:p-8">
        <PageHeader
          title="대시보드"
          description="농장 방문자 현황과 통계를 한눈에 확인하세요"
          breadcrumbs={[{ label: "대시보드" }]}
          actions={<InstallGuide />}
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="대시보드 오류"
      description="대시보드 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <>
        <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10 p-1 sm:p-6 lg:p-8">
          {/* 헤더 섹션 */}
          <div className="space-y-4">
            <PageHeader
              title="대시보드"
              description="농장 방문자 현황과 통계를 한눈에 확인하세요"
              breadcrumbs={[{ label: "대시보드" }]}
              actions={<InstallGuide />}
            />
          </div>

          {/* 통계 카드 섹션 */}
          <section className="space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>핵심 통계</span>
              </div>

              {/* 농장 선택기를 핵심통계 제목과 같은 행에 배치 */}
              <FarmSelector
                selectedFarm={selectedFarm}
                onFarmChange={handleFarmSelect}
                availableFarms={availableFarms}
                isAdmin={isAdmin}
              />
            </div>
            {/* 기존 StatsGrid 디자인 유지 */}
            <StatsGrid stats={dashboardStats} />
          </section>

          {/* 차트 섹션 */}
          <section className="space-y-4 lg:space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>상세 분석</span>
            </div>
            <ChartGrid
              visitorTrend={visitorTrend}
              purposeStats={chartData.purposeStats}
              timeStats={chartData.timeStats}
              regionStats={chartData.regionStats}
              weekdayStats={chartData.weekdayStats}
            />
          </section>
        </div>

        {/* 알림 권한 요청 다이얼로그는 DialogManager에서 관리하므로 제거 */}
      </>
    </ErrorBoundary>
  );
}
