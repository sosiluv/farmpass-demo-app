import { Bar } from "@/components/ui/chart";

interface VisitorTimeChartProps {
  data: { hour: string; count: number }[];
}

export function VisitorTimeChart({ data }: VisitorTimeChartProps) {
  // 데이터가 없거나 모든 count 값이 0일 때 안내 메시지
  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((item) => !item.count || item.count === 0);
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>시간대별 방문자 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <Bar
      data={{
        labels: data.map((item) => item.hour),
        datasets: [
          {
            label: "방문자 수",
            data: data.map((item) => item.count),
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            borderColor: "rgb(79, 82, 221)",
            borderWidth: 1,
            borderRadius: 10,
            maxBarThickness: 60,
            hoverBackgroundColor: "rgba(99, 102, 241, 0.9)",
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
