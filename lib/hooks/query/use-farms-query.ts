"use client";

import React from "react";
import {
  useAuthenticatedQuery,
  queryKeys,
  createFarmQueryKey,
} from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import type { Farm } from "@/lib/hooks/use-farms";

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

  // 농장 목록 쿼리 - 기존 방식과 동일한 API 호출
  const farmsQuery = useAuthenticatedQuery(
    createFarmQueryKey(targetUserId),
    async (): Promise<Farm[]> => {
      // 기존 Store와 동일한 API 엔드포인트 사용
      const { farms } = await apiClient("/api/farms", {
        method: "GET",
      });

      return farms || [];
    },
    {
      enabled: state.status === "authenticated" && !!targetUserId,
      staleTime: 5 * 60 * 1000, // 5분 캐싱 (농장 데이터는 자주 변경되지 않음)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // 인증 에러는 재시도 안함
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Unauthorized"))
        ) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

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

    // TODO: Mutation 기능들 (다음 단계에서 구현)
    // addFarm: () => {},
    // updateFarm: () => {},
    // deleteFarm: () => {},
  };
}

/**
 * 기존 Hook과의 호환성을 위한 alias
 */
export { useFarmsQuery as useFarmsRQ };
