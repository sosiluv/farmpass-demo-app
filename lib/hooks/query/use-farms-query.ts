"use client";

import React from "react";
import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { farmsKeys } from "./query-keys";
import type { Farm, FarmMember, Profile } from "@/lib/types/common";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";

// Farm 타입을 확장하여 멤버 정보 포함
interface FarmWithMembers extends Farm {
  farm_members?: Array<
    FarmMember & {
      profiles: Pick<
        Profile,
        "id" | "name" | "email" | "profile_image_url" | "avatar_seed"
      >;
    }
  >;
}

/**
 * React Query 기반 Farms Hook
 * 기존 use-farms.ts의 API 호출 방식과 동일하게 구현
 */
export function useFarmsQuery(userId?: string, includeMembers?: boolean) {
  const { userId: authUserId, isAuthenticated } = useAuth();

  // 현재 사용자 ID 결정 (매개변수 또는 인증된 사용자)
  const targetUserId = React.useMemo(() => {
    if (userId) return userId;
    if (isAuthenticated) {
      return authUserId;
    }
    return undefined;
  }, [userId, isAuthenticated]);

  // 농장 목록 쿼리 - 새로운 Query Key 체계 사용
  const farmsQuery = useAuthenticatedQuery(
    farmsKeys.list({ userId: targetUserId, includeMembers }),
    async (): Promise<FarmWithMembers[]> => {
      // includeMembers 옵션에 따라 엔드포인트 결정
      const endpoint = includeMembers
        ? "/api/farms?include=members"
        : "/api/farms";

      const { farms } = await apiClient(endpoint, {
        method: "GET",
        context: includeMembers
          ? "농장 목록 조회 (멤버 정보 포함)"
          : "농장 목록 조회",
      });

      return farms || [];
    },
    {
      enabled: isAuthenticated && !!targetUserId,
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
