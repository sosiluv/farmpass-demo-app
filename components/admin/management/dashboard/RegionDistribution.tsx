import { Bar } from "@/components/ui/chart";
import { MapPin } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";

interface RegionDistributionProps {
  data?: {
    region: string;
    count: number;
  }[];
}

export function RegionDistribution({ data = [] }: RegionDistributionProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title="지역별 농장 분포"
        description="농장 주소 기반 지역별 현황"
        icon={MapPin}
        variant="info"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          데이터가 없습니다
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="지역별 농장 분포"
      description="농장 주소 기반 지역별 현황"
      icon={MapPin}
      variant="info"
    >
      <div className="flex-1 min-h-0 h-full w-full">
        <Bar
          data={{
            labels: data.map((item) => item.region),
            datasets: [
              {
                label: "농장 수",
                data: data.map((item) => item.count),
                backgroundColor: "rgba(168, 85, 247, 0.8)", // purple
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
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                cornerRadius: 8,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                  font: {
                    size: 13,
                  },
                },
                grid: {
                  color: "rgba(0, 0, 0, 0.05)",
                },
              },
              x: {
                ticks: {
                  font: {
                    size: 13,
                  },
                },
                grid: {
                  display: false,
                },
              },
            },
            animation: {
              duration: 1000,
              easing: "easeInOutQuart",
            },
            layout: {
              padding: {
                top: 16,
                bottom: 16,
              },
            },
          }}
          className="h-full w-full"
        />
      </div>
    </ChartCard>
  );
}
