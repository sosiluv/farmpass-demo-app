"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { getKSTTodayRange } from "@/lib/utils/datetime/date";
import { usersKeys } from "./query-keys";

// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";

// 트렌드 계산 헬퍼 함수 - 첫 달 시작 시 0% 표시
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  farmOwners: number;
  todayLogins: number;
  trends: {
    userGrowth: number;
    activeUsersTrend: number;
    farmOwnersTrend: number;
    loginsTrend: number;
  };
}

/**
 * React Query 기반 Admin Users Hook
 * 관리자 사용자 통계 데이터를 조회합니다.
 */
export function useAdminUsersQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  return useAuthenticatedQuery(
    usersKeys.list({ type: "admin-stats" }),
    async (): Promise<UserStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 오늘 날짜 범위 (KST)
      const { start: startOfDay, end: endOfDay } = getKSTTodayRange();

      // 이번 달과 지난 달 범위 계산
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // 병렬 쿼리 실행
      const [
        // 현재 통계
        totalUsersResult,
        activeUsersResult,
        farmOwnersResult,
        todayLoginsResult,
        
        // 지난 달 통계 (트렌드 계산용)
        lastMonthUsersResult,
        lastMonthActiveUsersResult,
        lastMonthFarmOwnersResult,
        lastMonthLoginsResult,
      ] = await Promise.all([
        // 현재 통계
        supabase.from("users").select("*", { count: "exact", head: true }),
        
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_sign_in_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // 지난 30일 내 활동
        
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_type", "farmer"),
        
        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .eq("action", "login")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),

        // 지난 달 통계
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),

        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_sign_in_at", lastMonthStart.toISOString())
          .lte("last_sign_in_at", lastMonthEnd.toISOString()),

        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_type", "farmer")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),

        supabase
          .from("activity_logs")
          .select("*", { count: "exact", head: true })
          .eq("action", "login")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
      ]);

      // 현재 통계
      const totalUsers = totalUsersResult.count || 0;
      const activeUsers = activeUsersResult.count || 0;
      const farmOwners = farmOwnersResult.count || 0;
      const todayLogins = todayLoginsResult.count || 0;

      // 지난 달 통계
      const lastMonthUsers = lastMonthUsersResult.count || 0;
      const lastMonthActiveUsers = lastMonthActiveUsersResult.count || 0;
      const lastMonthFarmOwners = lastMonthFarmOwnersResult.count || 0;
      const lastMonthLogins = lastMonthLoginsResult.count || 0;

      // 트렌드 계산
      const trends = {
        userGrowth: calculateTrend(totalUsers, lastMonthUsers),
        activeUsersTrend: calculateTrend(activeUsers, lastMonthActiveUsers),
        farmOwnersTrend: calculateTrend(farmOwners, lastMonthFarmOwners),
        loginsTrend: calculateTrend(todayLogins, lastMonthLogins),
      };

      return {
        totalUsers,
        activeUsers,
        farmOwners,
        todayLogins,
        trends,
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
export function useAdminUsersQueryCompat() {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useAdminUsersQuery();

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
