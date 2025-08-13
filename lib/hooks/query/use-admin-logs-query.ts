"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { adminKeys } from "./query-keys";
import type { SystemLog } from "@/lib/types/common";
import {
  getErrorMessage,
  mapRawErrorToCode,
} from "@/lib/utils/error/errorUtil";

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
export interface AdminLogsResponse {
  stats: LogStats;
  logs: SystemLog[];
}

export function useAdminLogsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const isAdmin =
    state.status === "authenticated" && state.user?.app_metadata?.isAdmin;

  const logsQuery = useAuthenticatedQuery(
    adminKeys.logs.stats(),
    async (): Promise<AdminLogsResponse> => {
      try {
        const response = await apiClient("/api/admin/logs", {
          method: "GET",
          context: "관리자 시스템 로그 통계 조회",
        });
        return response as AdminLogsResponse;
      } catch (error) {
        const errorCode = mapRawErrorToCode(error, "db");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }
    },
    {
      enabled: !!user && isAdmin,
      staleTime: 1000 * 60 * 2, // 2분간 stale하지 않음 (로그는 더 자주 변경될 수 있음)
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchInterval: 1000 * 60 * 10, // 10분마다 자동 갱신
      refetchOnMount: false, // 마운트 시 refetch 비활성화 (캐시 우선)
    }
  );

  return logsQuery;
}
