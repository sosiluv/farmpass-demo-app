"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useFarms } from "@/lib/hooks/use-farms";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useFarmVisitors } from "@/lib/hooks/use-farm-visitors";
import { PageHeader } from "@/components/layout";
import {
  DashboardSkeleton,
  FarmSelector,
  StatsGrid,
  ChartGrid,
} from "@/components/admin/dashboard";
import { NotificationPermissionDialog } from "@/components/admin/notifications";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { Button } from "@/components/ui/button";
import { Bell, Bug, RotateCcw, BarChart3, TrendingUp } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { calculateUnifiedChartData } from "@/lib/utils/data/common-stats";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { AdminError } from "@/components/error/admin-error";
import { useMultipleLoadingTimeout } from "@/hooks/useTimeout";
import { InstallGuide } from "@/components/common/InstallGuide";
import { usePWAInstall } from "@/components/providers/pwa-provider";

export default function DashboardPage() {
  const { state } = useAuth();
  const { farms: availableFarms, fetchState } = useFarms();
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
    if (fetchState.loading || availableFarms.length === 0) {
      return "";
    }

    if (isAdmin) {
      return "all"; // admin의 경우 기본값을 '전체 농장'으로 설정
    } else {
      return availableFarms[0]?.id || "";
    }
  }, [fetchState.loading, availableFarms, isAdmin]);

  // selectedFarm 상태 관리 개선
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // 농장 선택 콜백 - useCallback으로 최적화
  const handleFarmSelect = useCallback((farmId: string) => {
    setSelectedFarm(farmId);
  }, []);

  // 알림 권한 관리
  const {
    showDialog,
    handleAllow,
    handleDeny,
    closeDialog,
    showDialogForce,
    resetPermissionState,
    getDebugInfo,
    lastMessage,
    clearLastMessage,
  } = useNotificationPermission();

  const { showWarning, showSuccess, showError } = useCommonToast();

  // 초기 농장 선택 설정 - 한 번만 실행
  useEffect(() => {
    if (
      !isInitialized &&
      initialSelectedFarm &&
      !fetchState.loading &&
      availableFarms.length > 0
    ) {
      setSelectedFarm(initialSelectedFarm);
      setIsInitialized(true);
      devLog.log(`Initial farm selected: ${initialSelectedFarm}`);
    }
  }, [
    initialSelectedFarm,
    fetchState.loading,
    availableFarms.length,
    isInitialized,
  ]);

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

  // useFarmVisitors 호출을 메모화하여 불필요한 재호출 방지
  const memoizedSelectedFarm = useMemo(() => {
    return selectedFarm === "all" ? null : selectedFarm;
  }, [selectedFarm]);

  const {
    loading: visitorsLoading,
    visitors,
    dashboardStats,
    visitorTrend,
    refetch: refetchVisitors,
  } = useFarmVisitors(memoizedSelectedFarm);

  // 통합 차트 데이터 계산 - useMemo로 최적화
  const chartData = useMemo(
    () => calculateUnifiedChartData(visitors),
    [visitors]
  );

  // 초기 로딩 상태 최적화 - 데이터가 있으면 스켈레톤 숨김
  const isInitialLoading = useMemo(() => {
    return (
      userLoading ||
      (fetchState.loading && availableFarms.length === 0) ||
      (visitorsLoading &&
        selectedFarm &&
        selectedFarm !== "" &&
        visitors.length === 0)
    );
  }, [
    userLoading,
    fetchState.loading,
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
    [visitorsLoading, fetchState.loading],
    handleDataRefetch,
    { timeout: 10000 }
  );

  if (timeoutReached) {
    // 타임아웃 시 경고 메시지 표시
    showWarning(
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

  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary
      title="대시보드 오류"
      description="대시보드 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <>
        <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10 p-4 sm:p-6 lg:p-8">
          {/* 헤더 섹션 */}
          <div className="space-y-4">
            <PageHeader
              title="대시보드"
              description="농장 방문자 현황과 통계를 한눈에 확인하세요"
              breadcrumbs={[{ label: "대시보드" }]}
              actions={installInfo.canInstall ? <InstallGuide /> : null}
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

          {/* 개발 환경에서만 표시되는 알림 다이얼로그 테스트 버튼 */}
          {process.env.NODE_ENV === "development" && (
            <section className="border-t pt-6 mt-8">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 space-y-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Bug className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  알림 다이얼로그 디버깅 (개발 모드)
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={showDialogForce}
                    className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bell className="mr-1 h-3 w-3" />
                    다이얼로그 강제 표시
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPermissionState}
                    className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    권한 상태 초기화
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const debugInfo = getDebugInfo();
                      devLog.log("=== 알림 권한 디버깅 정보 ===", debugInfo);
                      alert(
                        `디버깅 정보:\n\n권한: ${
                          debugInfo?.currentPermission
                        }\n마지막 요청: ${debugInfo?.lastAsked}\n재요청 가능: ${
                          debugInfo?.canReAsk ? "YES" : "NO"
                        }\n재요청까지 남은 일수: ${
                          debugInfo?.daysUntilReAsk
                        }\n\nPWA 정보:\nPWA 모드: ${
                          debugInfo?.isPWA ? "YES" : "NO"
                        }\n표시 모드: ${debugInfo?.displayMode}\n웹푸시 지원: ${
                          debugInfo?.pushSupported ? "YES" : "NO"
                        }${
                          debugInfo?.iosVersion
                            ? `\niOS 버전: ${debugInfo.iosVersion}`
                            : ""
                        }\n\n다이얼로그 표시: ${
                          debugInfo?.state.showDialog ? "YES" : "NO"
                        }\n\n자세한 정보는 콘솔을 확인하세요.`
                      );
                    }}
                    className="text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bug className="mr-1 h-3 w-3" />
                    디버깅 정보
                  </Button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-medium">알림 권한 재요청 정책:</p>
                  <p>• 권한이 허용된 경우: 더 이상 요청하지 않음</p>
                  <p>• 권한이 거부되거나 미설정인 경우: 7일 간격으로 재요청</p>
                  <p>• 위 버튼들로 강제 테스트 가능</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 알림 권한 요청 다이얼로그 */}
        <NotificationPermissionDialog
          open={showDialog}
          onOpenChange={closeDialog}
          onAllow={handleAllow}
          onDeny={handleDeny}
          farmCount={availableFarms.length}
        />
      </>
    </ErrorBoundary>
  );
}
