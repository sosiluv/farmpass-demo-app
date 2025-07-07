"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { settingsKeys } from "./query-keys";

// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";

// 트렌드 계산 헬퍼 함수 - 첫 달 시작 시 0% 표시
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export interface LogStats {
  totalLogs: number;
  infoLogs: number;
  warningLogs: number;
  errorLogs: number;
  trends: {
    logGrowth: number;
  };
  logTrends: {
    errorTrend: number;
    warningTrend: number;
    infoTrend: number;
  };
}

/**
 * React Query 기반 Admin Logs Hook
 * 관리자 로그 통계 데이터를 조회합니다.
 */
export function useAdminLogsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  return useAuthenticatedQuery(
    [...settingsKeys.all, "logs", "admin-stats"],
    async (): Promise<LogStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 이번 달과 지난 달 범위 계산
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // 병렬 쿼리 실행
      const [
        // 현재 통계
        totalLogsResult,
        logsByLevelResult,
        
        // 지난 달 통계 (트렌드 계산용)
        lastMonthLogsResult,
        lastMonthLogsByLevelResult,
      ] = await Promise.all([
        // 현재 통계
        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true }),
        
        supabase.from("activity_logs").select("level"),

        // 지난 달 통계
        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),

        supabase
          .from("activity_logs")
          .select("level")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
      ]);

      // 현재 통계
      const totalLogs = totalLogsResult.count || 0;

      // 로그 레벨별 집계
      const logLevels = logsByLevelResult.data || [];
      const errorLogs = logLevels.filter((log) => log.level === "error").length;
      const warningLogs = logLevels.filter((log) => log.level === "warning").length;
      const infoLogs = logLevels.filter((log) => log.level === "info").length;

      // 지난 달 통계
      const lastMonthTotalLogs = lastMonthLogsResult.count || 0;
      const lastMonthLogLevels = lastMonthLogsByLevelResult.data || [];
      const lastMonthErrorLogs = lastMonthLogLevels.filter((log) => log.level === "error").length;
      const lastMonthWarningLogs = lastMonthLogLevels.filter((log) => log.level === "warning").length;
      const lastMonthInfoLogs = lastMonthLogLevels.filter((log) => log.level === "info").length;

      // 트렌드 계산
      const trends = {
        logGrowth: calculateTrend(totalLogs, lastMonthTotalLogs),
      };

      const logTrends = {
        errorTrend: calculateTrend(errorLogs, lastMonthErrorLogs),
        warningTrend: calculateTrend(warningLogs, lastMonthWarningLogs),
        infoTrend: calculateTrend(infoLogs, lastMonthInfoLogs),
      };

      return {
        totalLogs,
        infoLogs,
        warningLogs,
        errorLogs,
        trends,
        logTrends,
      };
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 2, // 2분간 stale하지 않음 (로그는 더 자주 변경될 수 있음)
      gcTime: 1000 * 60 * 5, // 5분간 캐시 유지
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
    }
  );
}

/**
 * Legacy Hook과의 호환성을 위한 Wrapper
 * 기존 코드와 동일한 인터페이스를 제공합니다.
 */
export function useAdminLogsQueryCompat() {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useAdminLogsQuery();

  return {
    stats,
    loading,
    error,
    refetch: async () => {
      const result = await refetch();
      return result.data;
    },
  };
}
