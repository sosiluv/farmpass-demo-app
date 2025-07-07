import { CommonStatCard } from "./CommonStatCard";
import type { ManagementStatCardConfig } from "@/lib/utils/data/common-stats";

interface CommonStatsGridProps {
  statConfigs: ManagementStatCardConfig[];
  className?: string;
}

const variantIconMap: Record<
  string,
  "users" | "calendar" | "trending" | "shield" | "building" | "default"
> = {
  "총 방문자": "users",
  "오늘 방문자": "calendar",
  "이번 주 방문자": "trending",
  "소독 실시율": "shield",
  "등록 농장": "building",
};

export function CommonStatsGrid({
  statConfigs,
  className = "",
}: CommonStatsGridProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
    >
      {statConfigs.map((config) => (
        <CommonStatCard
          key={config.title}
          title={config.title}
          value={config.value}
          description={config.description}
          variant={config.variant}
          trend={config.trend}
          icon={variantIconMap[config.title] || "default"}
        />
      ))}
    </div>
  );
}
