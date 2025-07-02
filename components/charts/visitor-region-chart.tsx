"use client";

import { Bar } from "@/components/ui/chart";

interface VisitorRegionData {
  region: string;
  count: number;
}

interface VisitorRegionChartProps {
  data: VisitorRegionData[];
}

export function VisitorRegionChart({ data }: VisitorRegionChartProps) {
  // 데이터가 없을 경우 기본 데이터 표시
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>지역별 방문자 데이터가 없습니다.</p>
      </div>
    );
  }

  // 상위 10개 지역만 표시하고 나머지는 '기타'로 그룹화
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const topRegions = sortedData.slice(0, 9);
  const otherCount = sortedData
    .slice(9)
    .reduce((sum, item) => sum + item.count, 0);

  const chartData = [
    ...topRegions,
    ...(otherCount > 0 ? [{ region: "기타", count: otherCount }] : []),
  ];

  return (
    <Bar
      data={{
        labels: chartData.map((item) => item.region),
        datasets: [
          {
            label: "방문자 수",
            data: chartData.map((item) => item.count),
            backgroundColor: "rgba(168, 85, 247, 0.8)",
            borderColor: "rgb(147, 51, 234)",
            borderWidth: 1,
            borderRadius: 10,
            maxBarThickness: 60,
            hoverBackgroundColor: "rgba(147, 51, 234, 0.9)",
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 13 } },
            grid: { color: "rgba(0, 0, 0, 0.05)" },
          },
          x: {
            ticks: { font: { size: 13 } },
            grid: { display: false },
          },
        },
        animation: { duration: 1000, easing: "easeInOutQuart" },
        layout: { padding: { top: 16, bottom: 16 } },
      }}
      className="h-full w-full"
    />
  );
}
