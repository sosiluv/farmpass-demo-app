import { Line } from "@/components/ui/chart";

interface VisitorTrendChartProps {
  data: { date: string; visitors: number }[];
}

export function VisitorTrendChart({ data }: VisitorTrendChartProps) {
  // 데이터가 없거나 모든 visitors 값이 0일 때 안내 메시지
  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((item) => !item.visitors || item.visitors === 0);
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>방문자 추이 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <Line
      data={{
        labels: data.map((item) => item.date),
        datasets: [
          {
            label: "방문자 수",
            data: data.map((item) => item.visitors),
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            fill: true,
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
            ticks: { font: { size: 14 } },
            grid: { color: "rgba(0, 0, 0, 0.05)" },
          },
          x: {
            ticks: { font: { size: 14 } },
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
