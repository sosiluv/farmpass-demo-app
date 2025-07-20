import { Users, Building2, UserCheck, FileText } from "lucide-react";
import { StatCard } from "./StatCard";
import { CommonStatsGrid } from "../shared/CommonStatsGrid";
import { LABELS } from "@/lib/constants/management";

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
        title={LABELS.TOTAL_USERS}
        value={totalUsers.toLocaleString()}
        description={LABELS.TOTAL_USERS_DESC}
        icon={Users}
        variant="info"
        trend={trends?.userGrowth}
      />
      <StatCard
        title={LABELS.TOTAL_FARMS}
        value={totalFarms.toLocaleString()}
        description={LABELS.TOTAL_FARMS_DESC}
        icon={Building2}
        variant="success"
        trend={trends?.farmGrowth}
      />
      <StatCard
        title={LABELS.TOTAL_VISITORS}
        value={totalVisitors.toLocaleString()}
        description={LABELS.TOTAL_VISITORS_DESC}
        icon={UserCheck}
        variant="warning"
        trend={trends?.visitorGrowth}
      />
      <StatCard
        title={LABELS.SYSTEM_LOGS}
        value={totalLogs.toLocaleString()}
        description={LABELS.SYSTEM_LOGS_DESC}
        icon={FileText}
        variant="default"
        trend={trends?.logGrowth}
      />
    </CommonStatsGrid>
  );
}
