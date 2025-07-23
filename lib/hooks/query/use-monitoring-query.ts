"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { settingsKeys } from "./query-keys";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

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
        techStack?: {
          framework: string;
          runtime: string;
          react: string;
          typescript: string;
          database: string;
          authentication: string;
          deployment: string;
          ui: string;
          state: string;
          monitoring: string;
          analytics: string;
        };
      };
      services: {
        database: string;
        api: string;
        memory: string;
      };
    };
    uptime: {
      success?: boolean;
      error?: string;
      message?: string;
      details?: string;
      stat: string;
      monitors: Array<{
        id: number;
        friendly_name: string;
        status: number;
        all_time_uptime_ratio: number;
        custom_uptime_ratio?: number;
        url?: string;
        interval?: number;
        type?: number;
        port?: string;
        create_datetime?: number;
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
 * 분리된 모니터링 API용 React Query 훅들
 */
export function useMonitoringHealthQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  return useAuthenticatedQuery(
    [...settingsKeys.all, "monitoring", "health"],
    async () => {
      return await apiClient("/api/monitoring/health", {
        context: "시스템 헬스체크 데이터 조회",
      });
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 2,
      retry: 3,
    }
  );
}

export function useMonitoringUptimeQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  return useAuthenticatedQuery(
    [...settingsKeys.all, "monitoring", "uptime"],
    async () => {
      return await apiClient("/api/monitoring/uptime", {
        context: "업타임 데이터 조회",
      });
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 2,
      retry: 3,
    }
  );
}

export function useMonitoringAnalyticsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  return useAuthenticatedQuery(
    [...settingsKeys.all, "monitoring", "analytics"],
    async () => {
      return await apiClient("/api/monitoring/analytics", {
        context: "방문자 통계 데이터 조회",
      });
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 2,
      retry: 3,
    }
  );
}

export function useMonitoringErrorsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  return useAuthenticatedQuery(
    [...settingsKeys.all, "monitoring", "errors"],
    async () => {
      return await apiClient("/api/monitoring/errors", {
        context: "에러 로그 데이터 조회",
      });
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 2,
      retry: 3,
    }
  );
}
