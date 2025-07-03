import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getFarmTypeLabel } from "@/lib/constants/farm-types";
import {
  getKSTTodayRange,
  createKSTDateRange,
} from "@/lib/utils/datetime/date";
import { devLog } from "@/lib/utils/logging/dev-logger";

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
  }[];
  recentActivities: {
    id: string;
    type: string;
    timestamp: string;
    details: string;
    userName?: string;
  }[];
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  const fetchDashboardStats = async () => {
    // 클라이언트에서만 실행
    if (!isClient) {
      setLoading(false);
      return;
    }

    // 간단한 중복 방지
    if (isFetchingRef.current) {
      devLog.log("[useAdminDashboard] 이미 로딩 중입니다.");
      return;
    }

    try {
      setLoading(true);
      isFetchingRef.current = true;
      setError(null);

      devLog.log("[useAdminDashboard] 대시보드 통계 데이터 가져오기 시작");

      // 병렬 데이터 조회
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

      // 샘플 데이터 로그 (처음 3개)
      if (users && users.length > 0) {
      }
      if (farms && farms.length > 0) {
      }

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

        // 해당 월에 등록된 사용자 수 (KST 기준)
        const monthUsers =
          users?.filter((user) => {
            if (!user.created_at) return false;
            const userDate = new Date(user.created_at);
            return userDate >= monthStartKST && userDate <= monthEndKST;
          }).length ?? 0;

        // 해당 월에 등록된 농장 수 (KST 기준)
        const monthFarms =
          farms?.filter((farm) => {
            if (!farm.created_at) return false;
            const farmDate = new Date(farm.created_at);
            return farmDate >= monthStartKST && farmDate <= monthEndKST;
          }).length ?? 0;

        // 해당 월까지의 누적 사용자 수 (KST 기준)
        const cumulativeUsers =
          users?.filter((user) => {
            if (!user.created_at) return false;
            const userDate = new Date(user.created_at);
            return userDate <= monthEndKST;
          }).length ?? 0;

        // 해당 월까지의 누적 농장 수 (KST 기준)
        const cumulativeFarms =
          farms?.filter((farm) => {
            if (!farm.created_at) return false;
            const farmDate = new Date(farm.created_at);
            return farmDate <= monthEndKST;
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
      }[] = [
        { status: "오류 보고됨" as const, count: errorLogs },
        { status: "정상 작동" as const, count: infoLogs },
        { status: "점검 필요" as const, count: warningLogs },
        { status: "최근 활동" as const, count: todayLogins },
        { status: "QR 스캔 동작" as const, count: todayVisitors },
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

      const statsData = {
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

      devLog.log("[useAdminDashboard] 최종 통계 데이터:", statsData);
      devLog.log("[useAdminDashboard] 대시보드 통계 데이터 가져오기 완료");

      setStats(statsData);
    } catch (err) {
      devLog.error(
        "[useAdminDashboard] 대시보드 통계 데이터 가져오기 실패:",
        err
      );
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to fetch dashboard stats")
      );
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    devLog.log("[useAdminDashboard] useEffect 실행됨");
    if (isClient) {
      fetchDashboardStats();
    }
  }, []);

  return { stats, loading, error, refetch: fetchDashboardStats };
}
