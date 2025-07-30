"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { adminKeys } from "./query-keys";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";
import { toDateString } from "@/lib/utils/datetime/date";
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
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  const usersQuery = useAuthenticatedQuery(
    adminKeys.users.stats(),
    async (): Promise<UserStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 사용자 통계 (farm_members와 조인하여 정확한 역할 파악)
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select(`*, farm_members(role)`);

      if (usersError) throw usersError;

      const totalUsers = users?.length ?? 0;
      const activeUsers = users?.filter((u) => u.is_active).length ?? 0;

      // 농장주 수 계산 (farm_members.role 기준)
      const farmOwners =
        users?.filter((user) => {
          if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            return farmMemberRole === "owner";
          }
          return false;
        }).length ?? 0;

      // 오늘 로그인 수 (시스템 로그에서 로그인 성공 액션만 조회)
      const today = toDateString(new Date());
      const { data: todayLogs } = await supabase
        .from("system_logs")
        .select("*")
        .eq("action", "LOGIN_SUCCESS")
        .gte("created_at", today);

      const todayLogins = todayLogs?.length ?? 0;

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

      // 이번 달까지의 총 수 (누적)
      const totalUsersThisMonth =
        users?.filter((u) => new Date(u.created_at) <= thisMonthEnd).length ??
        0;
      const activeUsersThisMonth =
        users?.filter(
          (u) => u.is_active && new Date(u.created_at) <= thisMonthEnd
        ).length ?? 0;

      // 농장주 수 계산 (이번 달까지)
      const farmOwnersThisMonth =
        users?.filter((user) => {
          if (new Date(user.created_at) > thisMonthEnd) return false;
          if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            return farmMemberRole === "owner";
          }
          return false;
        }).length ?? 0;

      // 오늘 로그인 관련 로그
      const todayLoginsThisMonth =
        todayLogs?.filter((l) => new Date(l.created_at) <= thisMonthEnd)
          .length ?? 0;

      // 지난 달까지의 총 수 (누적)
      const totalUsersLastMonth =
        users?.filter((u) => new Date(u.created_at) <= lastMonthEnd).length ??
        0;
      const activeUsersLastMonth =
        users?.filter(
          (u) => u.is_active && new Date(u.created_at) <= lastMonthEnd
        ).length ?? 0;

      // 농장주 수 계산 (지난 달까지)
      const farmOwnersLastMonth =
        users?.filter((user) => {
          if (new Date(user.created_at) > lastMonthEnd) return false;
          if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            return farmMemberRole === "owner";
          }
          return false;
        }).length ?? 0;

      // 지난 달 로그인 로그 (같은 날짜 범위로 비교)
      const lastMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
      const lastMonthStart = toDateString(lastMonthDate);
      const { data: lastMonthLogs } = await supabase
        .from("system_logs")
        .select("*")
        .eq("action", "LOGIN_SUCCESS")
        .gte("created_at", lastMonthStart)
        .lt(
          "created_at",
          toDateString(new Date(lastMonthDate.getTime() + 24 * 60 * 60 * 1000))
        );
      const todayLoginsLastMonth = lastMonthLogs?.length ?? 0;

      // 트렌드 계산
      const trends = {
        userGrowth: calculateTrend(totalUsersThisMonth, totalUsersLastMonth),
        activeUsersTrend: calculateTrend(
          activeUsersThisMonth,
          activeUsersLastMonth
        ),
        farmOwnersTrend: calculateTrend(
          farmOwnersThisMonth,
          farmOwnersLastMonth
        ),
        loginsTrend: calculateTrend(todayLoginsThisMonth, todayLoginsLastMonth),
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
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음 (사용자 데이터는 자주 변경됨)
      gcTime: 1000 * 60 * 15, // 15분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchInterval: 1000 * 60 * 15, // 15분마다 자동 갱신
      refetchOnMount: false, // 마운트 시 refetch 비활성화 (캐시 우선)
    }
  );

  // 🔥 관리자 사용자 통계 실시간 업데이트 구독
  useSupabaseRealtime({
    table: "farm_members",
    refetch: usersQuery.refetch,
    // 농장 멤버 변경은 사용자 통계에 영향을 줄 수 있음
  });

  return usersQuery;
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

/**
 * 관리자 사용자 목록 조회 Hook
 */
export function useAdminUsersListQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  const usersListQuery = useAuthenticatedQuery(
    adminKeys.users.list(),
    async (): Promise<any[]> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 사용자 목록 조회 (farm_members와 조인하여 역할 정보 포함)
      const { data: users, error: usersError } = await supabase.from("profiles")
        .select(`
          *,
          farm_members(
            id,
            role,
            created_at,
            farms(
              id,
              farm_name
            )
          )
        `);

      if (usersError) throw usersError;

      return users || [];
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: true,
    }
  );

  return usersListQuery;
}
