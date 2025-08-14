"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { adminKeys } from "./query-keys";
import { apiClient } from "@/lib/utils/data/api-client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getErrorMessage,
  mapRawErrorToCode,
} from "@/lib/utils/error/errorUtil";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";

export interface AdminDashboardStatsResponse {
  totalUsers: number;
  totalFarms: number;
  totalVisitors: number;
  totalLogs: number;
  trends: {
    userGrowth: number;
    farmGrowth: number;
    visitorGrowth: number;
    logGrowth: number;
  };
  farmTypeData: { type: string; count: number }[];
  userRoleData: { role: string; count: number }[];
  regionData: { region: string; count: number }[];
  monthlyData: { month: string; users: number; farms: number }[];
  systemUsageData: {
    status:
      | "오류 보고됨"
      | "오류 없음"
      | "점검 필요"
      | "정상 작동"
      | "QR 스캔 동작"
      | "최근 활동";
    count: number;
    trend: number;
  }[];
  recentActivities: {
    id: string;
    type: string;
    timestamp: string;
    details: string;
    userName?: string;
  }[];
  // 서버 집계된 대시보드 카드/차트 데이터
  dashboardStats: {
    totalVisitors: number;
    todayVisitors: number;
    weeklyVisitors: number;
    disinfectionRate: number;
    trends: {
      totalVisitorsTrend: string;
      todayVisitorsTrend: string;
      weeklyVisitorsTrend: string;
      disinfectionTrend: string;
    };
  };
  visitorTrend: { date: string; visitors: number }[];
  purposeStats: { category: string; count: number; percentage: number }[];
  timeStats: { label: string; value: number }[];
  weekdayStats: { label: string; value: number }[];
  regionStats: { category: string; count: number; percentage: number }[];
}

export function useAdminDashboardStatsQuery(farmId?: string) {
  const { user } = useAuth();
  const { farms } = useFarmsQuery();

  const query = useAuthenticatedQuery(
    adminKeys.dashboard(farmId),
    async (): Promise<AdminDashboardStatsResponse> => {
      try {
        const response = await apiClient(
          farmId
            ? `/api/admin/dashboard?farmId=${farmId}`
            : "/api/admin/dashboard",
          {
            method: "GET",
            context: "관리자 대시보드 통계 조회",
          }
        );
        return response;
      } catch (error) {
        const errorCode = mapRawErrorToCode(error, "db");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5분 캐싱
      gcTime: 15 * 60 * 1000, // 15분 캐시 유지
      refetchOnWindowFocus: true,
      refetchInterval: 10 * 60 * 1000, // 10분마다 자동 갱신
      refetchOnMount: true,
    }
  );

  // 실시간: 방문자 변경 시(refetch). farmId === "all" 이면 전체(내 소속 농장 범위 내) 반응
  useSupabaseRealtime({
    table: "visitor_entries",
    refetch: query.refetch,
    filter: (payload) => {
      const changedFarmId = payload?.new?.farm_id || payload?.old?.farm_id;
      return farmId === "all" || changedFarmId === farmId;
    },
    farms,
  });

  // 실시간: 농장 정보 변경 시. farmId === "all" 이면 모든 소속 농장 반응
  useSupabaseRealtime({
    table: "farms",
    refetch: query.refetch,
    filter: (payload) => {
      const changedId = payload?.new?.id || payload?.old?.id;
      return farmId === "all" || changedId === farmId;
    },
    farms,
  });

  return query;
}
