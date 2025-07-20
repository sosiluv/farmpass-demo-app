import { Bar } from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";
import { LABELS, PAGE_HEADER } from "@/lib/constants/management";

interface FarmTypeDistributionProps {
  data?: {
    type: string;
    count: number;
  }[];
}

export function FarmTypeDistribution({ data = [] }: FarmTypeDistributionProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title={PAGE_HEADER.FARM_TYPE_DISTRIBUTION_TITLE}
        description={PAGE_HEADER.FARM_TYPE_DISTRIBUTION_DESCRIPTION}
        icon={BarChart3}
        variant="info"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {LABELS.NO_DATA}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={PAGE_HEADER.FARM_TYPE_DISTRIBUTION_TITLE}
      description={PAGE_HEADER.FARM_TYPE_DISTRIBUTION_DESCRIPTION}
      icon={BarChart3}
      variant="info"
    >
      <div className="flex-1 min-h-0 h-full w-full">
        <Bar
          data={{
            labels: (data || []).map((item) => item.type),
            datasets: [
              {
                label: LABELS.FARM_COUNT,
                data: (data || []).map((item) => item.count),
                backgroundColor: [
                  "rgba(99, 102, 241, 0.8)", // indigo
                  "rgba(14, 165, 233, 0.8)", // sky
                  "rgba(168, 85, 247, 0.8)", // purple
                  "rgba(236, 72, 153, 0.8)", // pink
                  "rgba(34, 211, 238, 0.8)", // cyan
                ],
                borderColor: [
                  "rgb(79, 82, 221)", // indigo
                  "rgb(2, 132, 199)", // sky
                  "rgb(147, 51, 234)", // purple
                  "rgb(219, 39, 119)", // pink
                  "rgb(6, 182, 212)", // cyan
                ],
                borderWidth: 1,
                borderRadius: 10,
                maxBarThickness: 60,
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
