"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { farmsKeys } from "@/lib/hooks/query/query-keys";
import { useAuth } from "@/components/providers/auth-provider";
import type { FarmStats } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

// 트렌드 계산 헬퍼 함수 - 첫 달 시작 시 0% 표시
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * React Query 기반 Admin Farms Hook
 * 관리자 농장 통계 데이터를 조회합니다.
 */
export function useAdminFarmsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  const farmsQuery = useAuthenticatedQuery(
    farmsKeys.list({ type: "admin-stats" }),
    async (): Promise<FarmStats> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 농장 통계
      const { data: farms, error: farmsError } = await supabase
        .from("farms")
        .select("*");

      if (farmsError) throw farmsError;

      // 트렌드 계산을 위한 데이터
      const now = new Date();
      const thisMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        0,
        23,
        59,
        59
      );

      // 이번 달까지의 총 수 (누적)
      const totalFarmsThisMonth =
        farms?.filter((f) => new Date(f.created_at) <= thisMonthEnd).length ??
        0;
      const uniqueOwnersThisMonth = new Set(
        farms
          ?.filter((f) => new Date(f.created_at) <= thisMonthEnd)
          .map((f) => f.owner_id)
      ).size;
      const uniqueRegionsThisMonth = new Set(
        farms
          ?.filter((f) => new Date(f.created_at) <= thisMonthEnd)
          .map((f) => f.farm_address?.split(" ")[0])
      ).size;

      // 이번 달 등록 수
      const monthlyRegistrations =
        farms?.filter((f) => {
          const createdAt = new Date(f.created_at);
          return (
            createdAt >= new Date(now.getFullYear(), now.getMonth(), 1) &&
            createdAt <= thisMonthEnd
          );
        }).length ?? 0;
      const monthlyFarmRegistrations = monthlyRegistrations; // 호환성

      // 지난 달까지의 총 수 (누적)
      const lastMonthFarms =
        farms?.filter((f) => new Date(f.created_at) <= lastMonthEnd).length ??
        0;
      const lastMonthFarmOwners = new Set(
        farms
          ?.filter((f) => new Date(f.created_at) <= lastMonthEnd)
          .map((f) => f.owner_id)
      ).size;
      const lastMonthRegions = new Set(
        farms
          ?.filter((f) => new Date(f.created_at) <= lastMonthEnd)
          .map((f) => f.farm_address?.split(" ")[0])
      ).size;
      const lastMonthRegistrations =
        farms?.filter((f) => {
          const createdAt = new Date(f.created_at);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return createdAt >= lastMonth && createdAt <= lastMonthEnd;
        }).length ?? 0;

      // 트렌드 계산
      const trends = {
        farmGrowth: calculateTrend(totalFarmsThisMonth, lastMonthFarms),
        farmOwnersTrend: calculateTrend(
          uniqueOwnersThisMonth,
          lastMonthFarmOwners
        ),
        regionsTrend: calculateTrend(uniqueRegionsThisMonth, lastMonthRegions),
        registrationTrend: calculateTrend(
          monthlyRegistrations,
          lastMonthRegistrations
        ),
      };

      return {
        totalFarms: totalFarmsThisMonth,
        totalOwners: uniqueOwnersThisMonth,
        farmOwners: uniqueOwnersThisMonth,
        totalRegions: uniqueRegionsThisMonth,
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

  // 🔥 관리자 농장 통계 실시간 업데이트 구독 (농장 변경 시 갱신)
  useSupabaseRealtime({
    table: "farms",
    refetch: farmsQuery.refetch,
    events: ["INSERT", "UPDATE", "DELETE"],
    // 농장 변경은 농장 통계에 직접적인 영향을 줌
  });

  return farmsQuery;
}

/**
 * 관리자 농장 목록 조회 Hook
 */
export function useAdminFarmsListQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);

  const farmsListQuery = useAuthenticatedQuery(
    farmsKeys.list({ type: "admin-list" }),
    async (): Promise<any[]> => {
      // ExtendedFarm[] 대신 any[]로 변경
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // 농장 기본 정보 조회 (소유자 이름 포함)
      const { data, error } = await supabase.from("farms").select(`
        *,
        profiles!farms_owner_id_fkey(name)
      `);

      if (error) throw error;

      // 모든 농장의 구성원 수를 한 번에 조회
      const farmIds = (data || []).map((farm) => farm.id);

      let memberCounts: Record<string, number> = {};
      let visitorCounts: Record<string, number> = {};

      if (farmIds.length > 0) {
        // 구성원 수 조회 (한 번의 API 호출)
        const { data: memberData } = await supabase
          .from("farm_members")
          .select("farm_id")
          .in("farm_id", farmIds);

        // 농장별 구성원 수 계산
        memberCounts = (memberData || []).reduce((acc, member) => {
          acc[member.farm_id] = (acc[member.farm_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // 방문자 수 조회 (최근 30일)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: visitorData } = await supabase
          .from("visitor_entries")
          .select("farm_id")
          .in("farm_id", farmIds)
          .gte("visit_datetime", thirtyDaysAgo.toISOString());

        // 농장별 방문자 수 계산
        visitorCounts = (visitorData || []).reduce((acc, visitor) => {
          acc[visitor.farm_id] = (acc[visitor.farm_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // 농장 데이터에 구성원 수와 방문자 수 추가
      const farmsWithCounts: any[] = (data || []).map((farm) => ({
        // ExtendedFarm[] 대신 any[]로 변경
        ...farm,
        owner_name: (farm as any).profiles?.name || "알 수 없음",
        member_count: memberCounts[farm.id] || 0,
        visitor_count: visitorCounts[farm.id] || 0,
      }));

      return farmsWithCounts;
    },
    {
      enabled: !!user && profile?.account_type === "admin",
      staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      gcTime: 1000 * 60 * 10, // 10분간 캐시 유지
      refetchOnWindowFocus: true,
    }
  );

  // 농장 실시간 업데이트 - farms 테이블 변경 시 리프레시
  useSupabaseRealtime({
    table: "farms",
    refetch: farmsListQuery.refetch,
    events: ["INSERT", "UPDATE", "DELETE"],
  });

  return farmsListQuery;
}
