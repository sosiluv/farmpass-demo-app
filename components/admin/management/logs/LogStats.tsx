import { StatCard } from "../dashboard/StatCard";
import { CommonStatsGrid } from "../shared/CommonStatsGrid";
import {
  generateLogManagementStats,
  type LogManagementStats,
  type NumericTrendData,
} from "@/lib/utils/data/common-stats";
import type { LogStats as LogStatsType } from "@/hooks/admin/useAdminLogs";

interface LogStatsProps {
  stats: LogStatsType;
}

export function LogStats({ stats }: LogStatsProps) {
  // 통합 시스템 데이터 변환
  const logManagementStats: LogManagementStats = {
    totalLogs: stats.totalLogs,
    errorLogs: stats.errorLogs,
    warningLogs: stats.warningLogs,
    infoLogs: stats.infoLogs,
    trends: {
      logGrowth: stats.trends?.logGrowth || 0,
    } as NumericTrendData,
    logTrends: {
      errorTrend: stats.logTrends?.errorTrend || 0,
      warningTrend: stats.logTrends?.warningTrend || 0,
      infoTrend: stats.logTrends?.infoTrend || 0,
    } as NumericTrendData,
  };

  // 통합 시스템을 통한 통계 카드 생성
  const statCards = generateLogManagementStats(logManagementStats);

  return (
    <CommonStatsGrid>
      {(statCards || []).map((card, index) => (
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
  );
}
