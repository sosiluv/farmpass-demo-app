"use client";

import React from "react";
import { useAuthenticatedQuery, queryKeys } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { VisitorEntry } from "@/lib/types";

/**
 * React Query 기반 Farm Visitors Hook - 간단한 버전부터 시작
 * 기존 use-farm-visitors.ts를 점진적으로 마이그레이션
 */
export function useFarmVisitorsQuery(farmId: string | null) {
  const { state } = useAuth();
  const supabase = createClient();

  // 방문자 데이터 쿼리
  const visitorsQuery = useAuthenticatedQuery(
    queryKeys.visitors(farmId || undefined),
    async (): Promise<VisitorEntry[]> => {
      let query = supabase
        .from("visitor_entries")
        .select("*")
        .order("visit_datetime", { ascending: false });

      // farmId가 null이면 전체 농장 데이터 조회
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`방문자 데이터 조회 실패: ${error.message}`);
      }

      return data || [];
    },
    {
      enabled: state.status === "authenticated",
      staleTime: 2 * 60 * 1000, // 2분 캐싱
      refetchOnWindowFocus: true, // 창 포커스 시 새로고침
    }
  );

  // 기본 통계 (간단한 계산만)
  const basicStats = React.useMemo(() => {
    const visitors = visitorsQuery.data || [];
    
    return {
      totalVisitors: visitors.length,
      todayVisitors: visitors.filter(v => {
        const today = new Date().toDateString();
        const visitDate = new Date(v.visit_datetime).toDateString();
        return visitDate === today;
      }).length,
      // 임시로 빈 배열들 (나중에 기존 통계 함수 연동)
      visitorTrend: [],
      purposeStats: [],
      weekdayStats: [],
      revisitStats: [],
      dashboardStats: {
        totalVisitors: visitors.length,
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
  }, [visitorsQuery.data]);

  return {
    // 기존 인터페이스 호환성 유지
    visitors: visitorsQuery.data || [],
    visitorTrend: basicStats.visitorTrend,
    purposeStats: basicStats.purposeStats,
    weekdayStats: basicStats.weekdayStats,
    revisitStats: basicStats.revisitStats,
    dashboardStats: basicStats.dashboardStats,
    
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

/**
 * 기존 Hook과의 호환성을 위한 alias
 */
export { useFarmVisitorsQuery as useFarmVisitorsRQ };
