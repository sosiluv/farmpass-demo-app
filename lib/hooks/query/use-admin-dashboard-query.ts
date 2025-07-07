"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { getFarmTypeLabel } from "@/lib/constants/farm-types";
import {
  getKSTTodayRange,
  createKSTDateRange,
} from "@/lib/utils/datetime/date";
import { dashboardKeys } from "./query-keys";

// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";

// 트렌드 계산 헬퍼 함수 - 첫 달 시작 시 0% 표시
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    // 이전 데이터가 없으면 첫 달이므로 0% 표시 (시작점)
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export interface DashboardStats {
  totalUsers: number;
  totalFarms: number;
  totalVisitors: number;
  totalLogs: number;
  todayVisitors: number;
  todayLogins: number;
  errorLogs: number;
  infoLogs: number;
  warningLogs: number;
  trends: {
    userGrowth: number;
    farmGrowth: number;
    visitorGrowth: number;
    logGrowth: number;
  };
  // 차트 데이터
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
}

/**
 * React Query 기반 Admin Dashboard Hook
 * 관리자 대시보드의 모든 통계 데이터를 조회합니다.
 */
export function useAdminDashboardQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  return useAuthenticatedQuery(
    dashboardKeys.adminStats(),
    async (): Promise<DashboardStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 오늘 날짜 범위 (KST)
      const { start: startOfDay, end: endOfDay } = getKSTTodayRange();

      // 이번 달과 저번 달 범위 계산
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // 병렬 쿼리 실행
      const [
        usersResult,
        farmsResult,
        visitorsResult,
        logsResult,
        todayVisitorsResult,
        todayLoginsResult,
        logsByLevelResult,
        lastMonthUsersResult,
        lastMonthFarmsResult,
        lastMonthVisitorsResult,
        lastMonthLogsResult,
        farmTypesResult,
        userRolesResult,
        regionResult,
      ] = await Promise.all([
        // 현재 달 기본 통계
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("farms").select("*", { count: "exact", head: true }),
        supabase
          .from("visitors")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thisMonthStart.toISOString())
          .lte("created_at", thisMonthEnd.toISOString()),
        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thisMonthStart.toISOString())
          .lte("created_at", thisMonthEnd.toISOString()),

        // 오늘 통계
        supabase
          .from("visitors")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),
        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .eq("action", "login")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),

        // 로그 레벨별 통계
        supabase.from("activity_logs").select("level"),

        // 지난 달 통계 (트렌드 계산용)
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("farms")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("visitors")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),

        // 차트 데이터
        supabase.from("farms").select("farm_type"),
        supabase.from("profiles").select("account_type"),
        supabase.from("farms").select("farm_address"),
      ]);

      // 월별 트렌드 데이터 (최근 6개월)
      const monthlyData = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
          
          const [usersResult, farmsResult] = await Promise.all([
            supabase
              .from("users")
              .select("*", { count: "exact", head: true })
              .gte("created_at", monthStart.toISOString())
              .lte("created_at", monthEnd.toISOString()),
            supabase
              .from("farms")
              .select("*", { count: "exact", head: true })
              .gte("created_at", monthStart.toISOString())
              .lte("created_at", monthEnd.toISOString()),
          ]);

          return {
            month: targetDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "short",
            }),
            users: usersResult.count || 0,
            farms: farmsResult.count || 0,
          };
        })
      );

      // 기본 통계
      const totalUsers = usersResult.count || 0;
      const totalFarms = farmsResult.count || 0;
      const totalVisitors = visitorsResult.count || 0;
      const totalLogs = logsResult.count || 0;

      // 오늘 통계
      const todayVisitors = todayVisitorsResult.count || 0;
      const todayLogins = todayLoginsResult.count || 0;

      // 로그 레벨별 집계
      const logLevels = logsByLevelResult.data || [];
      const errorLogs = logLevels.filter((log) => log.level === "error").length;
      const infoLogs = logLevels.filter((log) => log.level === "info").length;
      const warningLogs = logLevels.filter(
        (log) => log.level === "warning"
      ).length;

      // 트렌드 계산
      const lastMonthUsers = lastMonthUsersResult.count || 0;
      const lastMonthFarms = lastMonthFarmsResult.count || 0;
      const lastMonthVisitors = lastMonthVisitorsResult.count || 0;
      const lastMonthLogs = lastMonthLogsResult.count || 0;

      const trends = {
        userGrowth: calculateTrend(totalUsers, lastMonthUsers),
        farmGrowth: calculateTrend(totalFarms, lastMonthFarms),
        visitorGrowth: calculateTrend(totalVisitors, lastMonthVisitors),
        logGrowth: calculateTrend(totalLogs, lastMonthLogs),
      };

      // 농장 타입별 분포
      const farmTypes = farmTypesResult.data || [];
      const farmTypeData = Object.entries(
        farmTypes.reduce((acc, farm) => {
          const type = getFarmTypeLabel(farm.farm_type);
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({ type, count }));

      // 사용자 역할별 분포
      const userRoles = userRolesResult.data || [];
      const userRoleData = Object.entries(
        userRoles.reduce((acc, profile) => {
          const role =
            profile.account_type === "admin" ? "관리자" : "일반 사용자";
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([role, count]) => ({ role, count }));

      // 지역별 분포
      const regions = regionResult.data || [];
      const regionData = Object.entries(
        regions.reduce((acc, farm) => {
          const region = farm.farm_address?.split(" ")[0] || "기타";
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([region, count]) => ({ region, count }));

      // 시스템 사용량 데이터
      const systemUsageData = [
        {
          status: "정상 작동" as const,
          count: totalUsers + totalFarms,
          trend: Math.max(trends.userGrowth, trends.farmGrowth),
        },
        {
          status: "최근 활동" as const,
          count: todayVisitors + todayLogins,
          trend: Math.round(((todayVisitors + todayLogins) / Math.max(totalVisitors + totalLogs, 1)) * 100),
        },
        {
          status: errorLogs > 0 ? ("오류 보고됨" as const) : ("오류 없음" as const),
          count: errorLogs,
          trend: errorLogs > 0 ? -10 : 0,
        },
      ];

      // 최근 활동 데이터 (실제 로그에서 가져오기)
      const recentActivitiesResult = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const recentActivities = (recentActivitiesResult.data || []).map((log) => ({
        id: log.id,
        type: log.action,
        timestamp: new Date(log.created_at).toISOString(),
        details: `${log.action} - ${log.metadata?.target || "N/A"}`,
        userName: log.user_id || "시스템",
      }));

      return {
        totalUsers,
        totalFarms,
        totalVisitors,
        totalLogs,
        todayVisitors,
        todayLogins,
        errorLogs,
        infoLogs,
        warningLogs,
        trends,
        farmTypeData,
        userRoleData,
        regionData,
        monthlyData,
        systemUsageData,
        recentActivities,
      };
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 10, // 10분마다 자동 갱신
    }
  );
}

/**
 * Legacy Hook과의 호환성을 위한 Wrapper
 * 기존 코드와 동일한 인터페이스를 제공합니다.
 */
export function useAdminDashboardQueryCompat() {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useAdminDashboardQuery();

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
