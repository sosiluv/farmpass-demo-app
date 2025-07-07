import { StatCard } from "../dashboard/StatCard";
import { CommonStatsGrid } from "../shared/CommonStatsGrid";
import {
  generateFarmManagementStats,
  type FarmManagementStats,
  type NumericTrendData,
} from "@/lib/utils/data/common-stats";

interface FarmStatsProps {
  totalFarms: number;
  totalOwners: number;
  totalRegions: number;
  monthlyRegistrations: number;
  trends?: {
    farmGrowth: number;
    farmOwnersTrend: number;
    regionsTrend: number;
    registrationTrend: number;
  };
}

export function FarmStats({
  totalFarms,
  totalOwners,
  totalRegions,
  monthlyRegistrations,
  trends,
}: FarmStatsProps) {
  // 통합 시스템 데이터 변환
  const farmManagementStats: FarmManagementStats = {
    totalFarms,
    totalOwners,
    totalRegions,
    monthlyRegistrations,
    trends: {
      farmGrowth: trends?.farmGrowth || 0,
      farmOwnersTrend: trends?.farmOwnersTrend || 0,
      registrationTrend: trends?.registrationTrend || 0,
    } as NumericTrendData,
  };

  // 통합 시스템을 통한 통계 카드 생성
  const statCards = generateFarmManagementStats(farmManagementStats);

  return (
    <CommonStatsGrid>
      {(statCards || []).map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          variant={card.variant}
          trend={card.trend}
        />
      ))}
    </CommonStatsGrid>
  );
}
