import { ChartCard } from "@/components/common/ChartCard";
import { VisitorTrendChart } from "@/components/charts/visitor-trend-chart";
import { VisitorPurposeChart } from "@/components/charts/visitor-purpose-chart";
import { VisitorTimeChart } from "@/components/charts/visitor-time-chart";
import { VisitorRegionChart } from "@/components/charts/visitor-region-chart";
import { WeekdayVisitorChart } from "@/components/charts/weekday-visitor-chart";
import { TrendingUp, Target, Clock, MapPin, Calendar } from "lucide-react";
import type {
  ChartDataPoint,
  DistributionData,
} from "@/lib/utils/data/common-stats";

interface ChartGridProps {
  visitorTrend: any[]; // 이건 기존 형식 유지 (useFarmVisitors에서 제공)
  purposeStats: DistributionData[]; // 통합 타입
  timeStats: ChartDataPoint[]; // 통합 타입
  regionStats: DistributionData[]; // 통합 타입
  weekdayStats: ChartDataPoint[]; // 통합 타입
}

export function ChartGrid({
  visitorTrend,
  purposeStats,
  timeStats,
  regionStats,
  weekdayStats,
}: ChartGridProps) {
  // 통합 데이터를 기존 차트 형식으로 변환
  const adaptedPurposeStats =
    (purposeStats || []).map((stat) => ({
      purpose: stat.category,
      count: stat.count,
      percentage: stat.percentage,
    })) || [];

  const adaptedTimeStats =
    (timeStats || []).map((stat) => ({
      hour: stat.label,
      count: stat.value,
    })) || [];

  const adaptedRegionStats =
    (regionStats || []).map((stat) => ({
      region: stat.category,
      count: stat.count,
    })) || [];

  const adaptedWeekdayStats =
    (weekdayStats || []).map((stat) => ({
      day: stat.label,
      count: stat.value,
      average: stat.value, // 평균값은 동일하게 설정
    })) || [];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* 주요 차트들 - 2열 레이아웃, 데스크톱에서 더 큰 크기 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <ChartCard
          title="방문자 추이"
          description="기간별 방문자 수 변화 추이를 확인하세요"
          icon={TrendingUp}
          variant="info"
          className="min-h-[400px] flex flex-col"
        >
          <VisitorTrendChart data={visitorTrend} />
        </ChartCard>

        <ChartCard
          title="방문 목적 분포"
          description="방문 목적별 비율과 분포 현황"
          icon={Target}
          variant="success"
          className="min-h-[400px] flex flex-col"
        >
          <VisitorPurposeChart data={adaptedPurposeStats} />
        </ChartCard>
      </div>

      {/* 하위 차트들 - 태블릿부터 1열, 대형 데스크톱에서만 3열 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <ChartCard
          title="시간대별 방문자"
          description="시간대별 방문자 분포 패턴"
          icon={Clock}
          variant="warning"
          className="min-h-[400px] flex flex-col"
        >
          <VisitorTimeChart data={adaptedTimeStats} />
        </ChartCard>

        <ChartCard
          title="지역별 방문자"
          description="방문자 출신 지역별 분포 현황"
          icon={MapPin}
          variant="info"
          className="min-h-[400px] flex flex-col"
        >
          <VisitorRegionChart data={adaptedRegionStats} />
        </ChartCard>

        <ChartCard
          title="요일별 방문자"
          description="요일별 방문자 수와 평균 방문 패턴"
          icon={Calendar}
          variant="warning"
          className="min-h-[400px] flex flex-col"
        >
          <WeekdayVisitorChart data={adaptedWeekdayStats} />
        </ChartCard>
      </div>
    </div>
  );
}
