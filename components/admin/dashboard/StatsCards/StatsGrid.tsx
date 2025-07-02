import { StatCard } from "./StatCard";
import type { DashboardStats } from "@/lib/types/statistics";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="총 방문자"
        value={stats.totalVisitors.toLocaleString()}
        description="전체 기간 누적"
        variant="info"
        trend={stats.trends.totalVisitorsTrend}
      />
      <StatCard
        title="오늘 방문자"
        value={stats.todayVisitors}
        description="오늘 방문한 방문자"
        variant="success"
        trend={stats.trends.todayVisitorsTrend}
      />
      <StatCard
        title="이번 주 방문자"
        value={stats.weeklyVisitors}
        description="최근 7일간"
        variant="default"
        trend={stats.trends.weeklyVisitorsTrend}
      />
      <StatCard
        title="소독 실시율"
        value={`${stats.disinfectionRate.toFixed(1)}%`}
        description="전체 방문자 대비"
        variant="warning"
        trend={stats.trends.disinfectionTrend}
      />
    </div>
  );
}
