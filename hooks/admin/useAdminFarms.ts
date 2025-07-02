import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";

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

export function useAdminFarms() {
  const [stats, setStats] = useState<FarmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchFarmStats = async () => {
    // 클라이언트에서만 실행
    if (!isClient) {
      setLoading(false);
      return;
    }

    // 간단한 중복 방지
    if (isFetching) {
      devLog.log("[useAdminFarms] 이미 로딩 중입니다.");
      return;
    }

    try {
      setLoading(true);
      setIsFetching(true);
      setError(null);

      devLog.log("[useAdminFarms] 농장 통계 데이터 가져오기 시작");

      // 농장 통계
      const { data: farms, error: farmsError } = await supabase
        .from("farms")
        .select("*");

      if (farmsError) throw farmsError;
      const totalFarms = farms?.length ?? 0;

      // 고유 소유자 수
      const uniqueOwners = new Set(farms?.map((f) => f.owner_id));
      const totalOwners = uniqueOwners.size;
      const farmOwners = totalOwners; // 호환성

      // 지역 수
      const uniqueRegions = new Set(
        farms?.map((f) => f.farm_address?.split(" ")[0])
      );
      const totalRegions = uniqueRegions.size;

      // 이번 달 등록 수 (간단한 구현)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyRegistrations =
        farms?.filter((f) => new Date(f.created_at) >= thisMonth).length ?? 0;
      const monthlyFarmRegistrations = monthlyRegistrations; // 호환성

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
      const monthlyRegistrationsThisMonth =
        farms?.filter((f) => {
          const createdAt = new Date(f.created_at);
          return (
            createdAt >= new Date(now.getFullYear(), now.getMonth(), 1) &&
            createdAt <= thisMonthEnd
          );
        }).length ?? 0;

      // 지난 달까지의 총 수 (누적)
      const totalFarmsLastMonth =
        farms?.filter((f) => new Date(f.created_at) <= lastMonthEnd).length ??
        0;
      const uniqueOwnersLastMonth = new Set(
        farms
          ?.filter((f) => new Date(f.created_at) <= lastMonthEnd)
          .map((f) => f.owner_id)
      ).size;
      const uniqueRegionsLastMonth = new Set(
        farms
          ?.filter((f) => new Date(f.created_at) <= lastMonthEnd)
          .map((f) => f.farm_address?.split(" ")[0])
      ).size;
      const monthlyRegistrationsLastMonth =
        farms?.filter((f) => {
          const createdAt = new Date(f.created_at);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return createdAt >= lastMonth && createdAt <= lastMonthEnd;
        }).length ?? 0;

      // 트렌드 계산
      const trends = {
        farmGrowth: calculateTrend(totalFarmsThisMonth, totalFarmsLastMonth),
        farmOwnersTrend: calculateTrend(
          uniqueOwnersThisMonth,
          uniqueOwnersLastMonth
        ),
        regionsTrend: calculateTrend(
          uniqueRegionsThisMonth,
          uniqueRegionsLastMonth
        ),
        registrationTrend: calculateTrend(
          monthlyRegistrationsThisMonth,
          monthlyRegistrationsLastMonth
        ),
      };

      setStats({
        totalFarms,
        totalOwners,
        farmOwners,
        totalRegions,
        monthlyRegistrations,
        monthlyFarmRegistrations,
        trends,
      });

      devLog.log("[useAdminFarms] 농장 통계 데이터 가져오기 완료");
    } catch (err) {
      devLog.error("[useAdminFarms] 농장 통계 데이터 가져오기 실패:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch farm stats")
      );
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchFarmStats();
    }
  }, []);

  return { stats, loading, error, refetch: fetchFarmStats };
}
