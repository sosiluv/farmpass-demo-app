import { Bar } from "@/components/ui/chart";
import { MapPin } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";
import { LABELS, PAGE_HEADER } from "@/lib/constants/management";

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
        title={PAGE_HEADER.REGION_DISTRIBUTION_TITLE}
        description={PAGE_HEADER.REGION_DISTRIBUTION_DESCRIPTION}
        icon={MapPin}
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
      title={PAGE_HEADER.REGION_DISTRIBUTION_TITLE}
      description={PAGE_HEADER.REGION_DISTRIBUTION_DESCRIPTION}
      icon={MapPin}
      variant="info"
    >
      <div className="flex-1 min-h-0 h-full w-full">
        <Bar
          data={{
            labels: (data || []).map((item) => item.region),
            datasets: [
              {
                label: LABELS.FARM_COUNT,
                data: (data || []).map((item) => item.count),
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
