import { StatCard } from "../dashboard/StatCard";
import { CommonStatsGrid } from "../shared/CommonStatsGrid";
import {
  generateUserManagementStats,
  type UserManagementStats,
  type NumericTrendData,
} from "@/lib/utils/data/common-stats";

interface UserStatsProps {
  totalUsers: number;
  activeUsers: number;
  farmOwners: number;
  todayLogins: number;
  trends?: {
    userGrowth: number;
    activeUsersTrend: number;
    farmOwnersTrend: number;
    loginsTrend: number;
  };
}

export function UserStats({
  totalUsers,
  activeUsers,
  farmOwners,
  todayLogins,
  trends,
}: UserStatsProps) {
  // 통합 시스템 데이터 변환
  const userManagementStats: UserManagementStats = {
    totalUsers,
    activeUsers,
    farmOwners,
    todayLogins,
    trends: {
      userGrowth: trends?.userGrowth || 0,
      activeUsersTrend: trends?.activeUsersTrend || 0,
      farmOwnersTrend: trends?.farmOwnersTrend || 0,
    } as NumericTrendData,
  };

  // 통합 시스템을 통한 통계 카드 생성
  const statCards = generateUserManagementStats(userManagementStats);

  return (
    <div className="mb-4">
      <CommonStatsGrid>
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            variant={card.variant}
            trend={card.trend}
          />
        ))}
      </CommonStatsGrid>
    </div>
  );
}
