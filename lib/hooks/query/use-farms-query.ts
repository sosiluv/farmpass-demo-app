"use client";

import React from "react";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { farmsKeys } from "./query-keys";
import type { Farm } from "@/lib/types/farm";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";

/**
 * React Query 기반 Farms Hook
 * 기존 use-farms.ts의 API 호출 방식과 동일하게 구현
 */
export function useFarmsQuery(userId?: string) {
  const { state } = useAuth();

  // 현재 사용자 ID 결정 (매개변수 또는 인증된 사용자)
  const targetUserId = React.useMemo(() => {
    if (userId) return userId;
    if (state.status === "authenticated") {
      return state.user?.id;
    }
    return undefined;
  }, [userId, state]);

  // 농장 목록 쿼리 - 새로운 Query Key 체계 사용
  const farmsQuery = useAuthenticatedQuery(
    farmsKeys.list({ userId: targetUserId }),
    async (): Promise<Farm[]> => {
      // 기존 Store와 동일한 API 엔드포인트 사용
      const { farms } = await apiClient("/api/farms", {
        method: "GET",
        context: "농장 목록 조회",
      });

      return farms || [];
    },
    {
      enabled: state.status === "authenticated" && !!targetUserId,
      staleTime: 15 * 60 * 1000, // 15분 캐싱 (농장 데이터는 자주 변경되지 않음)
      gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchOnReconnect: true,
    }
  );

  // 🔥 농장 실시간 업데이트 구독
  useSupabaseRealtime({
    table: "farms",
    refetch: farmsQuery.refetch,
    farms: farmsQuery.data || [], // farms 데이터를 전달
  });

  return {
    // 기존 인터페이스 호환성 유지
    farms: farmsQuery.data || [],
    fetchState: {
      loading: farmsQuery.isLoading,
      error: farmsQuery.error,
      success: !farmsQuery.isLoading && !farmsQuery.isError,
    },

    // 상태
    loading: farmsQuery.isLoading,
    isLoading: farmsQuery.isLoading,
    isError: farmsQuery.isError,
    error: farmsQuery.error,

    // 액션
    refetch: farmsQuery.refetch,
    fetchFarms: farmsQuery.refetch,
  };
}
