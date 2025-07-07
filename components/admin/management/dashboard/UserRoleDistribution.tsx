import { Pie } from "@/components/ui/chart";
import { Users } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";

interface UserRoleDistributionProps {
  data?: {
    role: string;
    count: number;
  }[];
}

export function UserRoleDistribution({ data = [] }: UserRoleDistributionProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title="사용자 역할별 분포"
        description="시스템 사용자의 역할별 현황"
        icon={Users}
        variant="success"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          데이터가 없습니다
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="사용자 역할별 분포"
      description="시스템 사용자의 역할별 현황"
      icon={Users}
      variant="success"
    >
      <div className="flex-1 min-h-0 h-full w-full">
        <Pie
          data={{
            labels: (data || []).map((item) => item.role),
            datasets: [
              {
                data: (data || []).map((item) => item.count),
                backgroundColor: [
                  "rgba(99, 102, 241, 0.8)", // indigo
                  "rgba(14, 165, 233, 0.8)", // sky
                  "rgba(168, 85, 247, 0.8)", // purple
                ],
                borderColor: [
                  "rgb(79, 82, 221)", // indigo
                  "rgb(2, 132, 199)", // sky
                  "rgb(147, 51, 234)", // purple
                ],
                borderWidth: 1,
                hoverOffset: 15,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom" as const,
                labels: {
                  padding: 26,
                  usePointStyle: true,
                  pointStyle: "circle",
                  font: {
                    size: 14,
                  },
                },
                margin: 24,
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
            animation: {
              duration: 1000,
              animateRotate: true,
              animateScale: true,
            },
            cutout: "55%",
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
