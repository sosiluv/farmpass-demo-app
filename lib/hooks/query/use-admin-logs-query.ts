"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { settingsKeys } from "./query-keys";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

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
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  const logsQuery = useAuthenticatedQuery(
    [...settingsKeys.all, "logs", "admin-stats"],
    async (): Promise<LogStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 로그 통계
      const { data: logs, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      const totalLogs = logs?.length ?? 0;
      const infoLogs = logs?.filter((l) => l.level === "info").length ?? 0;
      const warningLogs = logs?.filter((l) => l.level === "warn").length ?? 0;
      const errorLogs = logs?.filter((l) => l.level === "error").length ?? 0;

      // 트렌드 계산을 위한 데이터
      const now = new Date();
      const thisMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        0,
        23,
        59,
        59
      );

      // 이번 달까지의 로그 수 (누적)
      const totalLogsThisMonth =
        logs?.filter((l) => new Date(l.created_at) <= thisMonthEnd).length ?? 0;
      const infoLogsThisMonth =
        logs?.filter(
          (l) => new Date(l.created_at) <= thisMonthEnd && l.level === "info"
        ).length ?? 0;
      const warningLogsThisMonth =
        logs?.filter(
          (l) => new Date(l.created_at) <= thisMonthEnd && l.level === "warn"
        ).length ?? 0;
      const errorLogsThisMonthTotal =
        logs?.filter(
          (l) => new Date(l.created_at) <= thisMonthEnd && l.level === "error"
        ).length ?? 0;

      // 지난 달까지의 로그 수 (누적)
      const totalLogsLastMonth =
        logs?.filter((l) => new Date(l.created_at) <= lastMonthEnd).length ?? 0;
      const infoLogsLastMonth =
        logs?.filter(
          (l) => new Date(l.created_at) <= lastMonthEnd && l.level === "info"
        ).length ?? 0;
      const warningLogsLastMonth =
        logs?.filter(
          (l) => new Date(l.created_at) <= lastMonthEnd && l.level === "warn"
        ).length ?? 0;
      const errorLogsLastMonth =
        logs?.filter(
          (l) => new Date(l.created_at) <= lastMonthEnd && l.level === "error"
        ).length ?? 0;

      // 트렌드 계산
      const trends = {
        logGrowth: calculateTrend(totalLogsThisMonth, totalLogsLastMonth),
      };

      const logTrends = {
        errorTrend: calculateTrend(errorLogsThisMonthTotal, errorLogsLastMonth),
        warningTrend: calculateTrend(
          warningLogsThisMonth,
          warningLogsLastMonth
        ),
        infoTrend: calculateTrend(infoLogsThisMonth, infoLogsLastMonth),
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
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchInterval: 1000 * 60 * 10, // 10분마다 자동 갱신
      refetchOnMount: false, // 마운트 시 refetch 비활성화 (캐시 우선)
    }
  );

  // 🔥 로그 통계 실시간 업데이트 구독
  useSupabaseRealtime({
    table: "system_logs",
    refetch: logsQuery.refetch,
    events: ["INSERT", "UPDATE", "DELETE"],
    // 새로운 로그 생성/수정/삭제 시 통계 갱신
  });

  return logsQuery;
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
