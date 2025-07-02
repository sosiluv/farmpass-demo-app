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

export function useAdminUsers() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchUserStats = async () => {
    // 클라이언트에서만 실행
    if (!isClient) {
      setLoading(false);
      return;
    }

    // 간단한 중복 방지
    if (isFetching) {
      devLog.log("[useAdminUsers] 이미 로딩 중입니다.");
      return;
    }

    try {
      setLoading(true);
      setIsFetching(true);
      setError(null);

      devLog.log("[useAdminUsers] 사용자 통계 데이터 가져오기 시작");

      // 사용자 통계 (farm_members와 조인하여 정확한 역할 파악)
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select(`*, farm_members(role)`);

      if (usersError) throw usersError;

      const totalUsers = users?.length ?? 0;
      const activeUsers = users?.filter((u) => u.is_active).length ?? 0;

      // 농장주 수 계산 (account_type과 farm_members.role을 함께 고려)
      const farmOwners =
        users?.filter((user) => {
          if (user.account_type === "farm_owner") return true;
          if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            return (
              farmMemberRole === "owner" || farmMemberRole === "farm_owner"
            );
          }
          return false;
        }).length ?? 0;

      // 오늘 로그인 수 (시스템 로그에서 로그인 관련 액션 조회)
      const today = new Date().toISOString().split("T")[0];
      const { data: todayLogs } = await supabase
        .from("system_logs")
        .select("*")
        .like("action", "%LOGIN%")
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
          if (user.account_type === "farm_owner") return true;
          if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            return (
              farmMemberRole === "owner" || farmMemberRole === "farm_owner"
            );
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
          if (user.account_type === "farm_owner") return true;
          if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            return (
              farmMemberRole === "owner" || farmMemberRole === "farm_owner"
            );
          }
          return false;
        }).length ?? 0;

      // 지난 달 로그인 로그 (같은 날짜 범위로 비교)
      const lastMonthDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
      const lastMonthStart = lastMonthDate.toISOString().split("T")[0];
      const { data: lastMonthLogs } = await supabase
        .from("system_logs")
        .select("*")
        .like("action", "%LOGIN%")
        .gte("created_at", lastMonthStart)
        .lt(
          "created_at",
          new Date(lastMonthDate.getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
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

      devLog.log("[useAdminUsers] 사용자 통계 데이터 가져오기 완료");

      setStats({
        totalUsers,
        activeUsers,
        farmOwners,
        todayLogins,
        trends,
      });
    } catch (err) {
      devLog.error("[useAdminUsers] 사용자 통계 데이터 가져오기 실패:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch user stats")
      );
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchUserStats();
    }
  }, []);

  return { stats, loading, error, refetch: fetchUserStats };
}
