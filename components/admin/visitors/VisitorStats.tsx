import { Users, TrendingUp, Building2, Activity, Target } from "lucide-react";
import { StatCard, InsightCard } from "./components";

interface VisitorStatsProps {
  visitorStats: {
    totalVisitors: number;
    todayVisitors: number;
    totalFarms?: number;
    disinfectionRate?: number;
    trends?: {
      totalVisitorsTrend: string;
      todayVisitorsTrend: string;
      disinfectionTrend?: string;
    };
  };
  showFarmCount?: boolean;
  showDisinfectionRate?: boolean;
  topPurpose?: {
    purpose: string;
    count: number;
    percentage: number;
  } | null;
}

// 통계 카드 설정 타입 정의
interface StatConfig {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
  description: string;
  trend: string;
  suffix?: string;
}

// 통계 카드 설정 생성 함수
const createStatConfig = (
  visitorStats: VisitorStatsProps["visitorStats"]
): StatConfig[] => [
  {
    title: "총 방문자",
    value: visitorStats.totalVisitors,
    icon: Users,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconBg: "bg-blue-100",
    description: "전체 방문자",
    trend: visitorStats.trends?.totalVisitorsTrend || "데이터 없음",
  },
  {
    title: "오늘 방문자",
    value: visitorStats.todayVisitors,
    icon: TrendingUp,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    iconBg: "bg-emerald-100",
    description: "오늘 방문",
    trend: visitorStats.trends?.todayVisitorsTrend || "데이터 없음",
  },
];

export function VisitorStats({
  visitorStats,
  showFarmCount = true,
  showDisinfectionRate = false,
  topPurpose,
}: VisitorStatsProps) {
  // 기본 통계 카드 설정
  const baseStats = createStatConfig(visitorStats);

  // 농장 수 통계 (조건부 추가)
  if (showFarmCount && visitorStats.totalFarms !== undefined) {
    baseStats.push({
      title: "등록 농장",
      value: visitorStats.totalFarms,
      icon: Building2,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      iconBg: "bg-purple-100",
      description: "관리 농장",
      trend: visitorStats.totalFarms === 0 ? "농장 없음" : "운영중",
    });
  }

  // 방역 완료율 통계 (조건부 추가)
  if (showDisinfectionRate && visitorStats.disinfectionRate !== undefined) {
    baseStats.push({
      title: "방역 완료율",
      value: visitorStats.disinfectionRate,
      icon: Activity,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      iconBg: "bg-orange-100",
      description: "방역 완료",
      trend: visitorStats.trends?.disinfectionTrend || "안전",
      suffix: "%",
    });
  }

  // 방문 목적 TOP1 카드 추가 (방역 완료율 옆)
  if (topPurpose) {
    baseStats.push({
      title: "가장 많은 방문 목적",
      value: topPurpose.count,
      icon: Target,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      textColor: "text-pink-700",
      iconBg: "bg-pink-100",
      description: topPurpose.purpose,
      trend: `${topPurpose.percentage.toFixed(1)}%`,
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
      {/* 통계 카드들 */}
      {(baseStats || []).map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}

      {/* 인사이트 카드 */}
      <InsightCard
        totalVisitors={visitorStats.totalVisitors}
        todayVisitors={visitorStats.todayVisitors}
        totalFarms={visitorStats.totalFarms}
        showFarmCount={showFarmCount}
      />
    </div>
  );
}
