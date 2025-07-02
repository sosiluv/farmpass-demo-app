import { Pie } from "@/components/ui/chart";

export function VisitorPurposeChart({ data }: { data: any[] }) {
  // 데이터가 없거나 모든 count 값이 0일 때 안내 메시지
  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((item) => !item.count || item.count === 0);
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>방문 목적별 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <Pie
      data={{
        labels: data.map((item) => item.purpose),
        datasets: [
          {
            data: data.map((item) => item.count),
            backgroundColor: [
              "rgba(99, 102, 241, 0.8)",
              "rgba(14, 165, 233, 0.8)",
              "rgba(168, 85, 247, 0.8)",
              "rgba(236, 72, 153, 0.8)",
              "rgba(34, 211, 238, 0.8)",
            ],
            borderColor: [
              "rgb(79, 82, 221)",
              "rgb(2, 132, 199)",
              "rgb(147, 51, 234)",
              "rgb(219, 39, 119)",
              "rgb(6, 182, 212)",
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
            position: "bottom",
            labels: {
              padding: 26,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 14 },
            },
            margin: 24,
          },
        },
        animation: { duration: 1000, animateRotate: true, animateScale: true },
        cutout: "55%",
        layout: { padding: { top: 16, bottom: 16 } },
      }}
      className="h-full w-full"
    />
  );
}
