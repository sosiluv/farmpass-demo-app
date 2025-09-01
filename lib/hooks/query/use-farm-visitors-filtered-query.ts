"use client";

import React from "react";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { visitorsKeys } from "@/lib/hooks/query/query-keys";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { VisitorEntry, VisitorFilters } from "@/lib/types";
import type { VisitorWithFarm } from "@/lib/types/visitor";

import {
  calculateVisitorStats,
  calculatePurposeStats,
  calculateWeekdayStats,
  calculateRevisitStats,
  generateDashboardStats,
} from "@/lib/utils/data/common-stats";
import { getKSTDayBoundsUTC } from "@/lib/utils/datetime/date";
import { addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";

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
  const { isAuthenticated } = useAuth();
  const supabase = createClient();

  // 쿼리 키 - 필터 변경 시 새로운 쿼리 실행
  const queryKey = React.useMemo(() => {
    const baseKey = visitorsKeys.list(filters.farmId || "all", {
      farmId: filters.farmId,
    });
    return [...baseKey, "filtered", filters.farmId || "all"];
  }, [
    filters.farmId, // 농장 필터만 DB 쿼리 키에 포함
  ]);

  // 방문자 데이터 쿼리 - 농장별 최적화
  const visitorsQuery = useAuthenticatedQuery(
    queryKey,
    async (): Promise<VisitorWithFarm[]> => {
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
        const errorCode = mapRawErrorToCode(error, "db");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }

      return data || [];
    },
    {
      enabled: isAuthenticated,
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
      return filters.farmId === undefined || changedFarmId === filters.farmId;
    },
  });

  // 검색어 필터링 최적화
  const searchFilteredVisitors = React.useMemo(() => {
    const allVisitors = visitorsQuery.data || [];
    if (!filters.searchTerm?.trim()) return allVisitors;

    const searchLower = filters.searchTerm.toLowerCase();
    return allVisitors.filter(
      (visitor) =>
        visitor.visitor_name?.toLowerCase().includes(searchLower) ||
        visitor.visitor_phone?.toLowerCase().includes(searchLower) ||
        visitor.visitor_address?.toLowerCase().includes(searchLower)
    );
  }, [visitorsQuery.data, filters.searchTerm]);

  // 날짜 범위 필터링 최적화
  const dateFilteredVisitors = React.useMemo(() => {
    if (!filters.dateRange || filters.dateRange === "all") {
      return searchFilteredVisitors;
    }

    let startUTC: Date | undefined;
    let endUTC: Date | undefined;

    const now = new Date();
    const kstNow = toZonedTime(now, "Asia/Seoul");

    switch (filters.dateRange) {
      case "today": {
        const { startUTC: s, endUTC: e } = getKSTDayBoundsUTC(new Date());
        startUTC = s;
        endUTC = e;
        break;
      }
      case "week": {
        const startKst = addDays(kstNow, -7);
        const { startUTC: s } = getKSTDayBoundsUTC(startKst);
        const { endUTC: e } = getKSTDayBoundsUTC(new Date());
        startUTC = s;
        endUTC = e;
        break;
      }
      case "month": {
        const startKst = addDays(kstNow, -30);
        const { startUTC: s } = getKSTDayBoundsUTC(startKst);
        const { endUTC: e } = getKSTDayBoundsUTC(new Date());
        startUTC = s;
        endUTC = e;
        break;
      }
      case "custom": {
        if (filters.dateStart) {
          const { startUTC: s } = getKSTDayBoundsUTC(
            new Date(filters.dateStart)
          );
          startUTC = s;
        }
        if (filters.dateEnd) {
          const { endUTC: e } = getKSTDayBoundsUTC(new Date(filters.dateEnd));
          endUTC = e;
        }
        // 기본값 보정: 시작 없으면 30일 전, 종료 없으면 오늘
        if (!startUTC) {
          const startKst = addDays(kstNow, -30);
          startUTC = getKSTDayBoundsUTC(startKst).startUTC;
        }
        if (!endUTC) {
          endUTC = getKSTDayBoundsUTC(new Date()).endUTC;
        }
        break;
      }
      default: {
        const startKst = addDays(kstNow, -30);
        const { startUTC: s } = getKSTDayBoundsUTC(startKst);
        const { endUTC: e } = getKSTDayBoundsUTC(new Date());
        startUTC = s;
        endUTC = e;
      }
    }

    return searchFilteredVisitors.filter((visitor) => {
      const visitInstant = new Date(visitor.visit_datetime);
      if (startUTC && visitInstant < startUTC) return false;
      if (endUTC && visitInstant > endUTC) return false;
      return true;
    });
  }, [
    searchFilteredVisitors,
    filters.dateRange,
    filters.dateStart,
    filters.dateEnd,
  ]);

  // 통계 계산 최적화
  const computedStats = React.useMemo(() => {
    const allVisitors = visitorsQuery.data || [];
    const filteredVisitors = dateFilteredVisitors;

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

    // 통계 계산을 위해 기본 방문자 정보만 추출
    const visitorsForStats: VisitorEntry[] = filteredVisitors.map(
      ({ farms, ...visitor }) => visitor
    );

    // 통계 계산
    const visitorTrend = calculateVisitorStats({
      visitors: visitorsForStats,
    });
    const purposeStats = calculatePurposeStats(visitorsForStats);
    const weekdayStats = calculateWeekdayStats(visitorsForStats);
    const revisitStats = calculateRevisitStats(visitorsForStats);
    const dashboardStats = generateDashboardStats(visitorsForStats);

    // 상위 방문 목적
    const topPurpose =
      purposeStats.length > 0
        ? purposeStats[0]
        : { purpose: "데이터 없음", count: 0, percentage: 0 };

    return {
      allVisitors,
      filteredVisitors,
      visitorTrend,
      purposeStats,
      weekdayStats,
      revisitStats,
      topPurpose,
      dashboardStats,
    };
  }, [visitorsQuery.data, dateFilteredVisitors]);

  return {
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
