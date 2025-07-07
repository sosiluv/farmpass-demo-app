"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { settingsKeys } from "./query-keys";

export interface MonitoringData {
  timestamp: string;
  services: {
    health: {
      status: string;
      timestamp: string;
      uptime: number;
      responseTime: string;
      version: string;
      performance: {
        totalResponseTime: string;
        databaseResponseTime: string;
        cpu: {
          user: string;
          system: string;
          total: string;
        };
      };
      system: {
        farmCount: number;
        visitorCount: number;
        memory: {
          used: number;
          total: number;
          external: number;
          status: string;
        };
        cpu: {
          user: number;
          system: number;
          total: number;
          threshold: number;
          status: string;
        };
        nodeVersion: string;
        platform: string;
        arch: string;
      };
      services: {
        database: string;
        api: string;
        memory: string;
      };
    };
    uptime: {
      stat: string;
      monitors: Array<{
        id: number;
        friendly_name: string;
        status: number;
        all_time_uptime_ratio: number;
      }>;
    };
    analytics: {
      visitors: number;
      pageviews: number;
      avgDuration: number;
    };
    errors: Array<{
      timestamp: string;
      level: string;
      message: string;
      context?: Record<string, any>;
    }>;
  };
  meta: {
    uptimeConfigured: boolean;
    analyticsConfigured: boolean;
  };
}

/**
 * React Query 기반 Monitoring Hook
 * 시스템 모니터링 대시보드 데이터를 조회합니다.
 */
export function useMonitoringQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  return useAuthenticatedQuery(
    [...settingsKeys.all, "monitoring", "dashboard"],
    async (): Promise<MonitoringData> => {
      const result = await apiClient("/api/monitoring/dashboard", {
        context: "시스템 모니터링 데이터 조회",
      });
      return result as MonitoringData;
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 2, // 2분간 stale하지 않음 (모니터링은 실시간성이 중요)
      gcTime: 1000 * 60 * 5, // 5분간 캐시 유지
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 2, // 2분마다 자동 갱신
      retry: 3, // 모니터링은 재시도가 중요
    }
  );
}

/**
 * Legacy 코드와의 호환성을 위한 Wrapper
 * 기존 코드와 동일한 인터페이스를 제공합니다.
 */
export function useMonitoringQueryCompat() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useMonitoringQuery();

  return {
    data,
    loading,
    error: error ? error.message : null,
    refetch: async () => {
      const result = await refetch();
      return result.data;
    },
  };
}
