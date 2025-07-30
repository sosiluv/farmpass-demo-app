"use client";

import React from "react";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { visitorsKeys } from "@/lib/hooks/query/query-keys";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { VisitorEntry } from "@/lib/types";
import type { VisitorStats } from "@/lib/types/statistics";
import {
  calculateVisitorStats,
  calculatePurposeStats,
  calculateWeekdayStats,
  calculateRevisitStats,
  generateDashboardStats,
} from "@/lib/utils/data/common-stats";
import {
  getKSTDaysAgo,
  toDateString,
  toKSTDate,
} from "@/lib/utils/datetime/date";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";

/**
 * React Query 기반 Farm Visitors Hook - 간단한 버전부터 시작
 * 기존 use-farm-visitors.ts를 점진적으로 마이그레이션
 */
export function useFarmVisitorsQuery(farmId: string | null) {
  const { state } = useAuth();
  const supabase = createClient();

  // 방문자 데이터 쿼리
  const visitorsQuery = useAuthenticatedQuery(
    visitorsKeys.list(farmId || "all"),
    async (): Promise<VisitorEntry[]> => {
      let query = supabase
        .from("visitor_entries")
        .select("*")
        .order("visit_datetime", { ascending: false });

      // farmId가 "all"이 아니면 특정 농장 필터링
      if (farmId && farmId !== "all") {
        query = query.eq("farm_id", farmId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`방문자 데이터 조회 실패: ${error.message}`);
      }

      return data || [];
    },
    {
      enabled: state.status === "authenticated" && farmId !== null, // null일 때는 쿼리 비활성화
      staleTime: 2 * 60 * 1000, // 🕐 2분 후 fresh → stale 상태 변경
      refetchOnWindowFocus: true, // 창 포커스 시 새로고침 (다른 탭에서 돌아올 때)
      refetchOnReconnect: true, // 네트워크 재연결 시 새로고침
      refetchInterval: false, // 자동 주기적 갱신 비활성화
      // 💡 stale 상태여도 캐시된 데이터는 계속 사용됨 (백그라운드에서 업데이트)
    }
  );

  // 🔥 방문자 실시간 업데이트를 위한 안정된 필터 함수
  // 실시간 업데이트 - visitor_entries 테이블 변경 시 리프레시
  useSupabaseRealtime({
    table: "visitor_entries",
    refetch: visitorsQuery.refetch,
    filter: (payload) => {
      const changedFarmId = payload?.new?.farm_id || payload?.old?.farm_id;
      // farmId가 "all"이면 모든 농장의 변경사항 처리 (전체 농장 선택)
      return farmId === "all" || changedFarmId === farmId;
    },
  });

  // 30일 날짜 배열 - 한 번만 생성하여 재사용
  const last30Days = React.useMemo(() => {
    return [...Array(30)].map((_, i) => new Date(getKSTDaysAgo(i))).reverse();
  }, []); // 의존성 없음 - 항상 최근 30일

  // 통계 계산 로직 최적화 - 각 통계별로 분리된 useMemo
  const computedStats = React.useMemo(() => {
    const visitors = visitorsQuery.data || [];

    if (visitors.length === 0) {
      return {
        visitorTrend: [],
        purposeStats: [],
        weekdayStats: [],
        revisitStats: [],
        dashboardStats: {
          totalVisitors: 0,
          todayVisitors: 0,
          weeklyVisitors: 0,
          disinfectionRate: 0,
          trends: {
            totalVisitorsTrend: "데이터 없음",
            todayVisitorsTrend: "데이터 없음",
            weeklyVisitorsTrend: "데이터 없음",
            disinfectionTrend: "데이터 없음",
          },
        },
      };
    }

    return { visitors };
  }, [visitorsQuery.data]);

  // 타입 호환성 변화 - 별도 메모이제이션
  // compatibleVisitors 변수 제거, computedStats.visitors 직접 사용
  const purposeStats = React.useMemo(() => {
    if (!computedStats.visitors || computedStats.visitors.length === 0)
      return [];
    return calculatePurposeStats(computedStats.visitors);
  }, [computedStats.visitors]);

  const weekdayStats = React.useMemo(() => {
    if (!computedStats.visitors || computedStats.visitors.length === 0)
      return [];
    return calculateWeekdayStats(computedStats.visitors);
  }, [computedStats.visitors]);

  const revisitStats = React.useMemo(() => {
    if (!computedStats.visitors || computedStats.visitors.length === 0)
      return [];
    return calculateRevisitStats(computedStats.visitors);
  }, [computedStats.visitors]);

  // 방문자 추이 계산 최적화 - KST 기준으로 날짜 처리
  const visitorTrend = React.useMemo((): VisitorStats[] => {
    if (!computedStats.visitors || computedStats.visitors.length === 0)
      return [];

    return last30Days.map((date) => {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayVisitors = computedStats.visitors.filter((v) => {
        // visit_datetime이 문자열인지 Date 객체인지 확인
        const visitDateTime = v.visit_datetime;

        // ISO 문자열을 KST로 변환하여 날짜 비교
        const visitDate = new Date(visitDateTime);
        const kstVisitDate = toKSTDate(visitDate);
        const kstDateStr = toDateString(kstVisitDate); // KST 기준 날짜 문자열
        const targetDateStr = toDateString(date); // 목표 날짜 문자열

        return kstDateStr === targetDateStr;
      });

      const dayStats = calculateVisitorStats({
        visitors: dayVisitors,
        showDisinfectionRate: true,
      });

      return {
        date: toDateString(date), // 대상 날짜는 이미 KST 기준으로 생성됨
        visitors: dayStats.total,
        disinfectionRate: dayStats.disinfectionRate,
      };
    });
  }, [computedStats.visitors, last30Days]);

  // 대시보드 통계 계산
  const dashboardStats = React.useMemo(() => {
    if (!computedStats.visitors || computedStats.visitors.length === 0) {
      return {
        totalVisitors: 0,
        todayVisitors: 0,
        weeklyVisitors: 0,
        disinfectionRate: 0,
        trends: {
          totalVisitorsTrend: "데이터 없음",
          todayVisitorsTrend: "데이터 없음",
          weeklyVisitorsTrend: "데이터 없음",
          disinfectionTrend: "데이터 없음",
        },
      };
    }
    return generateDashboardStats(computedStats.visitors);
  }, [computedStats.visitors]);

  return {
    // 기존 인터페이스 호환성 유지
    visitors: visitorsQuery.data || [],
    visitorTrend,
    purposeStats,
    weekdayStats,
    revisitStats,
    dashboardStats,

    // 상태
    loading: visitorsQuery.isLoading,
    isLoading: visitorsQuery.isLoading,
    isError: visitorsQuery.isError,
    error: visitorsQuery.error,

    // 액션
    refetch: visitorsQuery.refetch,
    fetchVisitors: visitorsQuery.refetch,
  };
}
