"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { farmsKeys } from "./query-keys";

// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";

// 트렌드 계산 헬퍼 함수 - 첫 달 시작 시 0% 표시
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

export interface FarmStats {
  totalFarms: number;
  totalOwners: number;
  farmOwners: number; // 농장 소유자 수 (UsersTab과 호환성)
  totalRegions: number;
  monthlyRegistrations: number;
  monthlyFarmRegistrations: number; // 호환성
  trends: {
    farmGrowth: number;
    farmOwnersTrend: number;
    regionsTrend: number;
    registrationTrend: number;
  };
}

/**
 * React Query 기반 Admin Farms Hook
 * 관리자 농장 통계 데이터를 조회합니다.
 */
export function useAdminFarmsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  return useAuthenticatedQuery(
    farmsKeys.list({ type: "admin-stats" }),
    async (): Promise<FarmStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 이번 달과 지난 달 범위 계산
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // 병렬 쿼리 실행
      const [
        // 현재 통계
        totalFarmsResult,
        farmOwnersResult,
        regionsResult,
        monthlyRegistrationsResult,
        
        // 지난 달 통계 (트렌드 계산용)
        lastMonthFarmsResult,
        lastMonthFarmOwnersResult,
        lastMonthRegistrationsResult,
      ] = await Promise.all([
        // 현재 통계
        supabase.from("farms").select("*", { count: "exact", head: true }),
        
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_type", "farmer"),
        
        supabase.from("farms").select("farm_address"),
        
        supabase
          .from("farms")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thisMonthStart.toISOString())
          .lte("created_at", thisMonthEnd.toISOString()),

        // 지난 달 통계
        supabase
          .from("farms")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),

        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_type", "farmer")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),

        supabase
          .from("farms")
          .select("*", { count: "exact", head: true })
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
      ]);

      // 현재 통계
      const totalFarms = totalFarmsResult.count || 0;
      const farmOwners = farmOwnersResult.count || 0;
      const totalOwners = farmOwners; // 호환성
      const monthlyRegistrations = monthlyRegistrationsResult.count || 0;
      const monthlyFarmRegistrations = monthlyRegistrations; // 호환성

      // 지역 수 계산
      const regions = regionsResult.data || [];
      const uniqueRegions = new Set(
        regions
          .map((farm) => farm.farm_address?.split(" ")[0])
          .filter(Boolean)
      );
      const totalRegions = uniqueRegions.size;

      // 지난 달 통계
      const lastMonthFarms = lastMonthFarmsResult.count || 0;
      const lastMonthFarmOwners = lastMonthFarmOwnersResult.count || 0;
      const lastMonthRegistrations = lastMonthRegistrationsResult.count || 0;

      // 트렌드 계산
      const trends = {
        farmGrowth: calculateTrend(totalFarms, lastMonthFarms),
        farmOwnersTrend: calculateTrend(farmOwners, lastMonthFarmOwners),
        regionsTrend: 0, // 지역은 트렌드 계산이 복잡하므로 일단 0
        registrationTrend: calculateTrend(monthlyRegistrations, lastMonthRegistrations),
      };

      return {
        totalFarms,
        totalOwners,
        farmOwners,
        totalRegions,
        monthlyRegistrations,
        monthlyFarmRegistrations,
        trends,
      };
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: true,
      refetchInterval: 1000 * 60 * 10, // 10분마다 자동 갱신
    }
  );
}

/**
 * Legacy Hook과의 호환성을 위한 Wrapper
 * 기존 코드와 동일한 인터페이스를 제공합니다.
 */
export function useAdminFarmsQueryCompat() {
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
  } = useAdminFarmsQuery();

  return {
    stats,
    loading,
    error,
    refetch: async () => {
      const result = await refetch();
      return result.data;
    },
  };
}
