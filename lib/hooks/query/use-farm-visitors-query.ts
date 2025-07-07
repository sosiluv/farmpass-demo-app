"use client";

import { useAuthenticatedQuery, queryKeys, createApiQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { VisitorEntry } from "@/lib/types";

/**
 * React Query 기반 Farm Visitors Hook
 * 기존 use-farm-visitors.ts를 React Query로 마이그레이션
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

  return {
    // 데이터
    visitors: visitorsQuery.data || [],
    
    // 상태
    isLoading: visitorsQuery.isLoading,
    isError: visitorsQuery.isError,
    error: visitorsQuery.error,
    
    // 액션
    refetch: visitorsQuery.refetch,
    
    // 기존 호환성을 위한 추가 상태
    loading: visitorsQuery.isLoading,
  };
}

/**
 * 방문자 통계 데이터 쿼리 (별도 분리)
 */
export function useVisitorStatsQuery(farmId: string | null, dateRange?: string) {
  const { state } = useAuth();

  return useAuthenticatedQuery(
    queryKeys.visitorStats(farmId || undefined, dateRange),
    createApiQuery(`/api/farms/${farmId}/visitors/stats?range=${dateRange || "all"}`),
    {
      enabled: state.status === "authenticated" && !!farmId,
      staleTime: 5 * 60 * 1000, // 5분 캐싱 (통계는 더 오래 캐싱)
    }
  );
}
