import { Bar } from "@/components/ui/chart";
import { LABELS } from "@/lib/constants/common";
import { useIsMobile } from "@/hooks/ui/use-mobile";

interface VisitorTrendChartProps {
  data: { date: string; visitors: number }[];
}

export function VisitorTrendChart({ data }: VisitorTrendChartProps) {
  const isMobile = useIsMobile();
  // 데이터가 없거나 모든 visitors 값이 0일 때 안내 메시지
  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((item) => !item.visitors || item.visitors === 0);
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>{LABELS.CHART_NO_TREND_DATA}</p>
      </div>
    );
  }

  // 날짜를 MM-DD 형식으로 변환하는 함수
  const formatDateToMMDD = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  };

  return (
    <Bar
      data={{
        labels: data.map((item) => formatDateToMMDD(item.date)),
        datasets: [
          {
            label: LABELS.CHART_VISITOR_COUNT,
            data: data.map((item) => item.visitors),
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            borderColor: "rgb(79, 82, 221)",
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 60,
            hoverBackgroundColor: "rgba(99, 102, 241, 0.9)",
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 14 },
            },
            margin: 24,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 13 } },
            grid: { color: "rgba(0, 0, 0, 0.05)" },
          },
          x: {
            ticks: {
              font: { size: 13 },
              maxTicksLimit: isMobile ? 7 : 0,
            },
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
