import { StatCard } from "./StatCard";
import { LABELS } from "@/lib/constants/dashboard";

interface DashboardStats {
  totalVisitors: number;
  todayVisitors: number;
  weeklyVisitors: number;
  disinfectionRate: number;
  trends: {
    totalVisitorsTrend: string;
    todayVisitorsTrend: string;
    weeklyVisitorsTrend: string;
    disinfectionTrend: string;
  };
}

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
      <StatCard
        title={LABELS.TOTAL_VISITORS}
        value={stats.totalVisitors.toLocaleString()}
        description={LABELS.TOTAL_VISITORS_DESC}
        variant="info"
        trend={stats.trends.totalVisitorsTrend}
      />
      <StatCard
        title={LABELS.TODAY_VISITORS}
        value={stats.todayVisitors}
        description={LABELS.TODAY_VISITORS_DESC}
        variant="success"
        trend={stats.trends.todayVisitorsTrend}
      />
      <StatCard
        title={LABELS.WEEKLY_VISITORS}
        value={stats.weeklyVisitors}
        description={LABELS.WEEKLY_VISITORS_DESC}
        variant="default"
        trend={stats.trends.weeklyVisitorsTrend}
      />
      <StatCard
        title={LABELS.DISINFECTION_RATE}
        value={`${stats.disinfectionRate.toFixed(1)}%`}
        description={LABELS.DISINFECTION_RATE_DESC}
        variant="warning"
        trend={stats.trends.disinfectionTrend}
      />
    </div>
  );
}
