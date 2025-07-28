"use client";

import React from "react";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { visitorsKeys } from "@/lib/hooks/query/query-keys";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { VisitorEntry, VisitorFilters } from "@/lib/types";

import {
  calculateVisitorStats,
  calculatePurposeStats,
  calculateWeekdayStats,
  calculateRevisitStats,
  generateDashboardStats,
} from "@/lib/utils/data/common-stats";
import {
  toKSTDate,
  createKSTDateRange,
  createKSTDateRangeSimple,
} from "@/lib/utils/datetime/date";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

/**
 * React Query 기반 방문자 필터링 Hook
 *
 * 지원 필터:
 * - 농장 선택
 * - 검색어 (이름, 연락처, 주소)
 * - 날짜 범위 (오늘, 일주일, 한달, 커스텀)
 */
export function useFarmVisitorsWithFiltersQuery(
  filters: Partial<VisitorFilters> = {}
) {
  const { state } = useAuth();
  const supabase = createClient();

  // 쿼리 키 - farmId 변경 시 새로운 쿼리 실행
  const queryKey = React.useMemo(() => {
    const baseKey = visitorsKeys.list(filters.farmId || "all", { filters });
    return [...baseKey, "filtered", filters.farmId || "all"];
  }, [filters.farmId]);

  // 방문자 데이터 쿼리 - 농장별 최적화
  const visitorsQuery = useAuthenticatedQuery(
    queryKey,
    async (): Promise<VisitorEntry[]> => {
      let query = supabase
        .from("visitor_entries")
        .select(
          `
          *,
          farms!inner(
            id,
            farm_name,
            farm_type,
            farm_address
          )
        `
        )
        .order("visit_datetime", { ascending: false });

      // farmId가 있으면 해당 농장의 데이터만 조회
      if (filters.farmId) {
        query = query.eq("farm_id", filters.farmId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`방문자 데이터 조회 실패: ${error.message}`);
      }

      return data || [];
    },
    {
      enabled: state.status === "authenticated",
      staleTime: 10 * 60 * 1000, // 10분 (중복 호출 방지)
      gcTime: 20 * 60 * 1000, // 20분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchOnReconnect: true,
    }
  );

  // 🔥 방문자 실시간 업데이트를 위한 안정된 필터 함수
  // 실시간 업데이트 - visitor_entries 테이블 변경 시 리프레시
  useSupabaseRealtime({
    table: "visitor_entries",
    refetch: visitorsQuery.refetch,
    filter: (payload) => {
      const changedFarmId = payload?.new?.farm_id || payload?.old?.farm_id;
      // filters.farmId가 null이면 모든 농장의 변경사항 처리 (전체 농장 선택)
      return filters.farmId === null || changedFarmId === filters.farmId;
    },
  });

  // 필터링된 데이터 및 통계 계산
  const computedStats = React.useMemo(() => {
    const allVisitors = visitorsQuery.data || [];
    if (allVisitors.length === 0) {
      return {
        allVisitors,
        filteredVisitors: [],
        visitorTrend: [],
        purposeStats: [],
        weekdayStats: [],
        revisitStats: [],
        topPurpose: {
          purpose: "데이터 없음",
          count: 0,
          percentage: 0,
        },
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

    // 클라이언트 사이드 필터링 (농장 필터는 DB에서 처리됨)
    let filteredVisitors = [...allVisitors];

    // 검색어 필터링
    if (filters.searchTerm?.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredVisitors = filteredVisitors.filter(
        (visitor) =>
          visitor.visitor_name?.toLowerCase().includes(searchLower) ||
          visitor.visitor_phone?.toLowerCase().includes(searchLower) ||
          visitor.visitor_address?.toLowerCase().includes(searchLower)
      );
    }

    // 날짜 범위 필터링 (KST 기준)
    if (filters.dateRange && filters.dateRange !== "all") {
      let startDate: Date;
      let endDate: Date;

      switch (filters.dateRange) {
        case "today":
          // 오늘 00:00:00 부터 23:59:59까지 (KST)
          ({ start: startDate, end: endDate } = createKSTDateRangeSimple(0, 0));
          break;
        case "week":
          // 7일 전부터 오늘까지 (KST)
          ({ start: startDate, end: endDate } = createKSTDateRangeSimple(7, 0));
          break;
        case "month":
          // 30일 전부터 오늘까지 (KST)
          ({ start: startDate, end: endDate } = createKSTDateRangeSimple(
            30,
            0
          ));
          break;
        case "custom":
          if (filters.dateStart) {
            startDate = createKSTDateRange(filters.dateStart, false);
          } else {
            // 기본값: 30일 전
            startDate = createKSTDateRangeSimple(30, 30).start;
          }
          if (filters.dateEnd) {
            endDate = createKSTDateRange(filters.dateEnd, true);
          } else {
            endDate = createKSTDateRangeSimple(0, 0).end;
          }
          break;
        default:
          // 기본값: 30일 전부터 오늘까지
          ({ start: startDate, end: endDate } = createKSTDateRangeSimple(
            30,
            0
          ));
      }

      filteredVisitors = filteredVisitors.filter((visitor) => {
        // ISO 문자열을 KST로 변환하여 비교
        const visitDate = new Date(visitor.visit_datetime);
        const kstVisitDate = toKSTDate(visitDate);

        return kstVisitDate >= startDate && kstVisitDate <= endDate;
      });
    }

    // 통계 계산
    const visitorTrend = calculateVisitorStats({
      visitors: filteredVisitors,
    });
    const purposeStats = calculatePurposeStats(filteredVisitors);
    const weekdayStats = calculateWeekdayStats(filteredVisitors);
    const revisitStats = calculateRevisitStats(filteredVisitors);
    const dashboardStats = generateDashboardStats(filteredVisitors);

    // 상위 방문 목적
    const topPurpose =
      purposeStats.length > 0
        ? purposeStats[0]
        : { purpose: "데이터 없음", count: 0, percentage: 0 };

    return {
      allVisitors,
      filteredVisitors: filteredVisitors,
      visitorTrend,
      purposeStats,
      weekdayStats,
      revisitStats,
      topPurpose,
      dashboardStats,
    };
  }, [visitorsQuery.data, filters]);

  return {
    // 데이터
    visitors: computedStats.filteredVisitors,
    allVisitors: computedStats.allVisitors,

    // 통계
    visitorTrend: computedStats.visitorTrend,
    purposeStats: computedStats.purposeStats,
    weekdayStats: computedStats.weekdayStats,
    revisitStats: computedStats.revisitStats,
    topPurpose: computedStats.topPurpose,
    dashboardStats: computedStats.dashboardStats,

    // 상태
    loading: visitorsQuery.isLoading,
    isLoading: visitorsQuery.isLoading,
    isError: visitorsQuery.isError,
    error: visitorsQuery.error,

    // 액션
    refetch: visitorsQuery.refetch,
  };
}

/**
 * 방문자 목적 옵션 조회 Hook
 */
export function useVisitorPurposeOptionsQuery(farmId?: string | null) {
  const { state } = useAuth();
  const supabase = createClient();

  return useAuthenticatedQuery(
    ["visitorPurposeOptions", farmId || "all"],
    async (): Promise<string[]> => {
      let query = supabase
        .from("visitor_entries")
        .select("visitor_purpose")
        .not("visitor_purpose", "is", null);

      if (farmId) {
        query = query.eq("farm_id", farmId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`방문 목적 옵션 조회 실패: ${error.message}`);
      }

      const purposes =
        data
          ?.map((item) => item.visitor_purpose)
          .filter((purpose): purpose is string => purpose !== null)
          .filter((purpose, index, arr) => arr.indexOf(purpose) === index)
          .sort() || [];

      return purposes;
    },
    {
      enabled: state.status === "authenticated",
      staleTime: 10 * 60 * 1000, // 10분
    }
  );
}
