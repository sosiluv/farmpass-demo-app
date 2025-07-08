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

      // 병렬 데이터 조회 (기존 legacy 코드 구조 참고)
      const [usersResult, farmsResult, visitorsResult, logsResult] =
        await Promise.all([
          supabase.from("profiles").select(`*, farm_members(role)`),
          supabase.from("farms").select("*"),
          supabase.from("visitor_entries").select("*"),
          supabase
            .from("system_logs")
            .select("*, profiles(name)")
            .order("created_at", { ascending: false }),
        ]);

      // 에러 체크
      if (usersResult.error) throw usersResult.error;
      if (farmsResult.error) throw farmsResult.error;
      if (visitorsResult.error) throw visitorsResult.error;
      if (logsResult.error) throw logsResult.error;

      const users = usersResult.data || [];
      const farms = farmsResult.data || [];
      const visitors = visitorsResult.data || [];
      const logs = logsResult.data || [];

      const totalUsers = users.length;
      const totalFarms = farms.length;
      const totalVisitors = visitors.length;

      // 오늘 방문자 수 (KST 기준)
      const { start: todayStart, end: todayEnd } = getKSTTodayRange();
      const todayVisitors = visitors.filter((v) => {
        const visitDate = new Date(v.visit_datetime);
        return visitDate >= todayStart && visitDate <= todayEnd;
      }).length;

      const totalLogs = logs.length;
      const infoLogs = logs.filter((l) => l.level === "info").length;
      const warningLogs = logs.filter((l) => l.level === "warn").length;
      const errorLogs = logs.filter((l) => l.level === "error").length;

      // 오늘 로그인 수 (KST 기준)
      const todayLogins = logs.filter((l) => {
        if (!l.created_at) return false;
        const logDate = new Date(l.created_at);
        return logDate >= todayStart && logDate <= todayEnd;
      }).length;

      // 농장 타입별 분포 (정확한 한글 라벨 사용)
      const farmTypeData =
        farms?.reduce((acc: { type: string; count: number }[], farm) => {
          const type = getFarmTypeLabel(farm.farm_type);
          const existing = acc.find((item) => item.type === type);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ type, count: 1 });
          }
          return acc;
        }, []) || [];

      // 사용자 역할별 분포 (account_type과 farm_members.role을 함께 고려)
      const userRoleData =
        users?.reduce((acc: { role: string; count: number }[], user) => {
          let role = "일반 사용자";

          // 관리자 확인
          if (user.account_type === "admin") {
            role = "관리자";
          }
          // farm_members 테이블에서 농장주 역할 확인
          else if (user.farm_members && user.farm_members.length > 0) {
            const farmMemberRole = user.farm_members[0]?.role;
            if (farmMemberRole === "owner" || farmMemberRole === "farm_owner") {
              role = "농장주";
            }
          } else if (user.account_type === "farm_owner") {
            role = "농장주";
          }

          const existing = acc.find((item) => item.role === role);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ role, count: 1 });
          }
          return acc;
        }, []) || [];

      // 지역별 분포 (간단한 구현)
      const regionData =
        farms?.reduce((acc: { region: string; count: number }[], farm) => {
          const region = farm.farm_address?.split(" ")[0] || "기타";
          const existing = acc.find((item) => item.region === region);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ region, count: 1 });
          }
          return acc;
        }, []) || [];

      // 월별 데이터 (KST 기준 실제 데이터)
      const currentDate = new Date();
      let monthlyData = [];

      for (let i = 3; i >= 0; i--) {
        const targetDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthName = `${targetDate.getMonth() + 1}월`;

        // KST 기준 월 시작/끝 계산 (유틸리티 사용)
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const monthStartStr = `${year}-${String(month + 1).padStart(
          2,
          "0"
        )}-01`;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const lastDay = new Date(nextYear, nextMonth, 0).getDate();
        const monthEndStr = `${year}-${String(month + 1).padStart(
          2,
          "0"
        )}-${String(lastDay).padStart(2, "0")}`;

        const monthStartKST = createKSTDateRange(monthStartStr, false); // 월 시작 00:00:00
        const monthEndKST = createKSTDateRange(monthEndStr, true); // 월 끝 23:59:59

        // 해당 월까지의 누적 사용자 수 (KST 기준)
        const cumulativeUsers =
          users?.filter((user) => {
            if (!user.created_at) return false;
            const createdAt = new Date(user.created_at);
            return createdAt <= monthEndKST;
          }).length ?? 0;

        // 해당 월까지의 누적 농장 수 (KST 기준)
        const cumulativeFarms =
          farms?.filter((farm) => {
            if (!farm.created_at) return false;
            const createdAt = new Date(farm.created_at);
            return createdAt <= monthEndKST;
          }).length ?? 0;

        // 누적 데이터를 사용 (더 의미 있는 차트)
        monthlyData.push({
          month: monthName,
          users: cumulativeUsers,
          farms: cumulativeFarms,
        });
      }

      // 만약 모든 누적 데이터가 0이고 실제 총 데이터는 있다면, 현재 총 수를 마지막 월에 표시
      const currentTotalUsers = users?.length ?? 0;
      const currentTotalFarms = farms?.length ?? 0;
      const hasRealData = currentTotalUsers > 0 || currentTotalFarms > 0;
      const allZero = monthlyData.every(
        (month) => month.users === 0 && month.farms === 0
      );

      if (hasRealData && allZero) {
        // 실제 데이터가 있지만 월별 분석이 안 되는 경우, 현재 총 수를 마지막 월에만 표시
        monthlyData[monthlyData.length - 1] = {
          ...monthlyData[monthlyData.length - 1],
          users: currentTotalUsers,
          farms: currentTotalFarms,
        };
      }

      // 시스템 사용량 데이터 (실제 데이터 기반)
      const systemUsageData: {
        status:
          | "오류 보고됨"
          | "오류 없음"
          | "점검 필요"
          | "정상 작동"
          | "QR 스캔 동작"
          | "최근 활동";
        count: number;
        trend: number;
      }[] = [
        {
          status: "오류 보고됨" as const,
          count: errorLogs,
          trend: errorLogs > 0 ? -10 : 0,
        },
        {
          status: "정상 작동" as const,
          count: totalUsers + totalFarms,
          trend: 0,
        },
        { status: "점검 필요" as const, count: warningLogs, trend: 0 },
        { status: "최근 활동" as const, count: todayLogins, trend: 0 },
        { status: "QR 스캔 동작" as const, count: todayVisitors, trend: 0 },
      ];

      // 최근 활동
      const recentActivities =
        logs?.slice(0, 5).map((log) => ({
          id: log.id,
          type: log.action,
          timestamp: log.created_at,
          details: log.message,
          userName: log.profiles?.name,
        })) || [];

      // 트렌드 계산을 위한 데이터
      const now = new Date();

      // 이번 달 말 기준 (현재까지)
      const thisMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );

      // 지난 달 말 기준
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        0,
        23,
        59,
        59
      );

      // 이번 달까지의 총 사용자/농장/방문자/로그 수 (누적)
      const totalUsersThisMonth =
        users?.filter((u) => new Date(u.created_at) <= thisMonthEnd).length ??
        0;
      const totalFarmsThisMonth =
        farms?.filter((f) => new Date(f.created_at) <= thisMonthEnd).length ??
        0;
      const totalVisitorsThisMonth =
        visitors?.filter((v) => new Date(v.visit_datetime) <= thisMonthEnd)
          .length ?? 0;
      const totalLogsThisMonth =
        logs?.filter((l) => new Date(l.created_at) <= thisMonthEnd).length ?? 0;

      // 지난 달까지의 총 사용자/농장/방문자/로그 수 (누적)
      const totalUsersLastMonth =
        users?.filter((u) => new Date(u.created_at) <= lastMonthEnd).length ??
        0;
      const totalFarmsLastMonth =
        farms?.filter((f) => new Date(f.created_at) <= lastMonthEnd).length ??
        0;
      const totalVisitorsLastMonth =
        visitors?.filter((v) => new Date(v.visit_datetime) <= lastMonthEnd)
          .length ?? 0;
      const totalLogsLastMonth =
        logs?.filter((l) => new Date(l.created_at) <= lastMonthEnd).length ?? 0;

      // 트렌드 계산
      const trends = {
        userGrowth: calculateTrend(totalUsersThisMonth, totalUsersLastMonth),
        farmGrowth: calculateTrend(totalFarmsThisMonth, totalFarmsLastMonth),
        visitorGrowth: calculateTrend(
          totalVisitorsThisMonth,
          totalVisitorsLastMonth
        ),
        logGrowth: calculateTrend(totalLogsThisMonth, totalLogsLastMonth),
      };

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
      staleTime: 1000 * 60 * 15, // 15분간 stale하지 않음 (중복 호출 방지)
      gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchInterval: 1000 * 60 * 30, // 30분마다 자동 갱신 (덜 빈번하게)
      refetchOnMount: false, // 마운트 시 refetch 비활성화 (캐시 우선)
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
