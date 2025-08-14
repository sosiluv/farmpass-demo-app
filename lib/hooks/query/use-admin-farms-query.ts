"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { adminKeys } from "@/lib/hooks/query/query-keys";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import {
  getErrorMessage,
  mapRawErrorToCode,
} from "@/lib/utils/error/errorUtil";

export interface FarmStats {
  totalFarms: number;
  totalOwners: number;
  totalRegions: number;
  monthlyRegistrations: number;
  trends: {
    farmGrowth: number;
    farmOwnersTrend: number;
    registrationTrend: number;
  };
}

export interface AdminFarmsResponse {
  stats: FarmStats;
  farms: any[];
}

/**
 * React Query 기반 Admin Farms Hook
 * 관리자 농장 통계 데이터를 조회합니다.
 */
export function useAdminFarmsQuery() {
  const { user, isAdmin } = useAuth();

  const farmsQuery = useAuthenticatedQuery(
    adminKeys.farms.stats(),
    async (): Promise<AdminFarmsResponse> => {
      try {
        const response = await apiClient("/api/admin/farms", {
          method: "GET",
          context: "관리자 농장 통계+목록 조회",
        });
        return response as AdminFarmsResponse;
      } catch (error) {
        const errorCode = mapRawErrorToCode(error, "db");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }
    },
    {
      enabled: !!user && isAdmin,
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 10, // 10분마다 자동 갱신
    }
  );

  // 🔥 관리자 농장 통계 실시간 업데이트 구독 (농장 변경 시 갱신)
  // Admin 대시보드는 실시간 업데이트가 필수가 아니므로 주기적 갱신으로 충분
  // useSupabaseRealtime({
  //   table: "farms",
  //   refetch: farmsQuery.refetch,
  //   // 농장 변경은 농장 통계에 직접적인 영향을 줌
  // });

  return farmsQuery;
}
