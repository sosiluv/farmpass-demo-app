import { Users, Building2, UserCheck, FileText } from "lucide-react";
import { StatCard } from "./StatCard";
import { CommonStatsGrid } from "../shared/CommonStatsGrid";

interface DashboardStatsProps {
  totalUsers: number;
  totalFarms: number;
  totalVisitors: number;
  totalLogs: number;
  trends?: {
    userGrowth: number;
    farmGrowth: number;
    visitorGrowth: number;
    logGrowth: number;
  };
}

export function DashboardStats({
  totalUsers,
  totalFarms,
  totalVisitors,
  totalLogs,
  trends,
}: DashboardStatsProps) {
  return (
    <CommonStatsGrid>
      <StatCard
        title="전체 사용자"
        value={totalUsers.toLocaleString()}
        description="시스템 전체 사용자 수"
        icon={Users}
        variant="info"
        trend={trends?.userGrowth}
      />
      <StatCard
        title="전체 농장"
        value={totalFarms.toLocaleString()}
        description="등록된 농장 수"
        icon={Building2}
        variant="success"
        trend={trends?.farmGrowth}
      />
      <StatCard
        title="총 방문자"
        value={totalVisitors.toLocaleString()}
        description="전체 방문자 수"
        icon={UserCheck}
        variant="warning"
        trend={trends?.visitorGrowth}
      />
      <StatCard
        title="시스템 로그"
        value={totalLogs.toLocaleString()}
        description="시스템 활동 로그"
        icon={FileText}
        variant="default"
        trend={trends?.logGrowth}
      />
    </CommonStatsGrid>
  );
}
