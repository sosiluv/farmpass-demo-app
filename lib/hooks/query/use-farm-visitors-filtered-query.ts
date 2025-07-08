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
import { getKSTDaysAgo, toKSTDateString } from "@/lib/utils/datetime/date";

export interface VisitorFilters {
  farmId?: string | null;
  searchTerm?: string;
  dateRange?: string; // "all" | "today" | "week" | "month" | "custom"
  dateStart?: string;
  dateEnd?: string;
}

/**
 * React Query 기반 방문자 필터링 Hook
 *
 * 지원 필터:
 * - 농장 선택
 * - 검색어 (이름, 연락처, 주소)
 * - 날짜 범위 (오늘, 일주일, 한달, 커스텀)
 */
export function useFarmVisitorsWithFiltersQuery(filters: VisitorFilters = {}) {
  const { state } = useAuth();
  const supabase = createClient();

  // 쿼리 키 - farmId 변경 시 새로운 쿼리 실행
  const queryKey = React.useMemo(() => {
    const baseKey = visitorsKeys.farm(filters.farmId || "all", { filters });
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

    // 날짜 필터
    if (filters.dateRange && filters.dateRange !== "all") {
      // 한국시간 기준으로 현재 시간 계산
      const now = new Date();
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(kstNow);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(kstNow);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date(kstNow);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(kstNow);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(kstNow);
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(kstNow);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "custom":
          if (filters.dateStart) {
            // 사용자가 선택한 날짜를 한국시간으로 해석
            startDate = new Date(filters.dateStart + "T00:00:00+09:00");
          }
          if (filters.dateEnd) {
            // 사용자가 선택한 날짜를 한국시간으로 해석
            endDate = new Date(filters.dateEnd + "T23:59:59+09:00");
          }
          break;
      }

      if (startDate) {
        filteredVisitors = filteredVisitors.filter(
          (visitor) => new Date(visitor.visit_datetime) >= startDate!
        );
      }

      if (endDate) {
        filteredVisitors = filteredVisitors.filter(
          (visitor) => new Date(visitor.visit_datetime) <= endDate!
        );
      }
    }

    // 검색어 필터
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredVisitors = filteredVisitors.filter(
        (visitor) =>
          visitor.visitor_name.toLowerCase().includes(searchLower) ||
          visitor.visitor_phone.toLowerCase().includes(searchLower) ||
          visitor.visitor_address.toLowerCase().includes(searchLower)
      );
    }

    // 타입 호환성 변환
    const compatibleVisitors = filteredVisitors.map((visitor) => ({
      ...visitor,
      registered_by: visitor.registered_by ?? undefined,
    }));

    // 통계 계산
    const visitorStats = calculateVisitorStats({
      visitors: compatibleVisitors,
    });
    const purposeStats = calculatePurposeStats(compatibleVisitors);
    const weekdayStats = calculateWeekdayStats(compatibleVisitors);
    const revisitStats = calculateRevisitStats(compatibleVisitors);

    // 최다 방문 목적 계산
    const topPurpose = {
      purpose: purposeStats[0]?.purpose || "데이터 없음",
      count: purposeStats[0]?.count || 0,
      percentage: purposeStats[0]?.percentage || 0,
    };
    // 30일 트렌드
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return toKSTDateString(date);
    });

    const visitorTrend = dates.map((date) => {
      const dateVisitors = compatibleVisitors.filter((visitor) => {
        const visitDate = toKSTDateString(new Date(visitor.visit_datetime));
        return visitDate === date;
      });

      return {
        date,
        count: dateVisitors.length,
        disinfected: dateVisitors.filter((v) => v.disinfection_check).length,
        consented: dateVisitors.filter((v) => v.consent_given).length,
      };
    });

    const dashboardStats = generateDashboardStats(compatibleVisitors);

    return {
      allVisitors,
      filteredVisitors: compatibleVisitors,
      visitorTrend,
      purposeStats,
      weekdayStats,
      revisitStats,
      dashboardStats,
      topPurpose,
    };
  }, [visitorsQuery.data, filters]);

  return {
    // 데이터
    visitors: computedStats.filteredVisitors || [],
    allVisitors: computedStats.allVisitors || [],
    visitorTrend: computedStats.visitorTrend,
    purposeStats: computedStats.purposeStats,
    weekdayStats: computedStats.weekdayStats,
    revisitStats: computedStats.revisitStats,
    dashboardStats: computedStats.dashboardStats,
    topPurpose: computedStats.topPurpose,

    // 상태
    loading: visitorsQuery.isLoading,
    isLoading: visitorsQuery.isLoading,
    isError: visitorsQuery.isError,
    error: visitorsQuery.error,

    // 액션
    refetch: visitorsQuery.refetch,

    // React Query 상태
    isFetching: visitorsQuery.isFetching,
    isStale: visitorsQuery.isStale,
    dataUpdatedAt: visitorsQuery.dataUpdatedAt,
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
