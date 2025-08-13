"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { adminKeys } from "./query-keys";
import { useSupabaseRealtime } from "@/hooks/notification/useSupabaseRealtime";
import type { Profile } from "@/lib/types/common";
import {
  getErrorMessage,
  mapRawErrorToCode,
} from "@/lib/utils/error/errorUtil";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  farmOwners: number;
  todayLogins: number;
  trends: {
    userGrowth: number;
    activeUsersTrend: number;
    farmOwnersTrend: number;
    loginsTrend: number;
  };
}

/**
 * 사용자 프로필 정보 타입 (farm_members와 조인된 결과)
 */
export interface UserProfileWithFarmMembers extends Profile {
  farm_members: Array<{
    id: string;
    role: string;
    created_at: string;
    farms: {
      id: string;
      farm_name: string;
    } | null;
  }> | null;
}

export interface AdminUsersResponse {
  stats: UserStats;
  users: UserProfileWithFarmMembers[];
}
/**
 * React Query 기반 Admin Users Hook
 * 관리자 사용자 통계 데이터를 조회합니다.
 */
export function useAdminUsersQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const isAdmin =
    state.status === "authenticated" && state.user?.app_metadata?.isAdmin;

  const usersQuery = useAuthenticatedQuery(
    adminKeys.users.stats(),
    async (): Promise<AdminUsersResponse> => {
      try {
        const response = await apiClient("/api/admin/users", {
          method: "GET",
          context: "관리자 사용자 통계 조회",
        });
        return response as AdminUsersResponse;
      } catch (error) {
        const errorCode = mapRawErrorToCode(error, "db");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }
    },
    {
      enabled: !!user && isAdmin,
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음 (사용자 데이터는 자주 변경됨)
      gcTime: 1000 * 60 * 15, // 15분간 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchInterval: 1000 * 60 * 15, // 15분마다 자동 갱신
      refetchOnMount: false, // 마운트 시 refetch 비활성화 (캐시 우선)
    }
  );

  // 🔥 관리자 사용자 통계 실시간 업데이트 구독
  useSupabaseRealtime({
    table: "farm_members",
    refetch: usersQuery.refetch,
    // 농장 멤버 변경은 사용자 통계에 영향을 줄 수 있음
  });

  return usersQuery;
}
