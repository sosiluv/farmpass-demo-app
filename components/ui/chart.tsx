"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ArcElement,
  Filler,
} from "chart.js/auto";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface ChartProps {
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
}

export function Bar({ data, options, className }: ChartProps) {
  return (
    <Chart type="bar" data={data} options={options} className={className} />
  );
}

export function Line({ data, options, className }: ChartProps) {
  return (
    <Chart type="line" data={data} options={options} className={className} />
  );
}

export function Pie({ data, options, className }: ChartProps) {
  return (
    <Chart type="pie" data={data} options={options} className={className} />
  );
}

export function Doughnut({ data, options, className }: ChartProps) {
  return (
    <Chart
      type="doughnut"
      data={data}
      options={options}
      className={className}
    />
  );
}
