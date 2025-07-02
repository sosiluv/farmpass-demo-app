import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";

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

export function useAdminLogs() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchLogStats = async () => {
    // 클라이언트에서만 실행
    if (!isClient) {
      setLoading(false);
      return;
    }

    // 간단한 중복 방지
    if (isFetching) {
      devLog.log("[useAdminLogs] 이미 로딩 중입니다.");
      return;
    }

    try {
      setLoading(true);
      setIsFetching(true);
      setError(null);

      devLog.log("[useAdminLogs] 로그 통계 데이터 가져오기 시작");

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

      setStats({
        totalLogs,
        infoLogs,
        warningLogs,
        errorLogs,
        trends,
        logTrends,
      });

      devLog.log("[useAdminLogs] 로그 통계 데이터 가져오기 완료");
    } catch (err) {
      devLog.error("[useAdminLogs] 로그 통계 데이터 가져오기 실패:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch log stats")
      );
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchLogStats();
    }
  }, []);

  return { stats, loading, error, refetch: fetchLogStats };
}
