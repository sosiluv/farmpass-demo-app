import { Bar } from "@/components/ui/chart";

interface WeekdayStats {
  day: string;
  count: number;
  average: number;
}

interface WeekdayVisitorChartProps {
  data: WeekdayStats[];
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function WeekdayVisitorChart({ data }: WeekdayVisitorChartProps) {
  return (
    <Bar
      data={{
        labels: data.map((item) => item.day),
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
          {
            label: "일평균",
            data: data.map((item) => item.average),
            backgroundColor: "rgba(16, 185, 129, 0.8)",
            borderColor: "rgb(5, 150, 105)",
            borderWidth: 1,
            borderRadius: 10,
            maxBarThickness: 60,
            hoverBackgroundColor: "rgba(16, 185, 129, 0.9)",
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
