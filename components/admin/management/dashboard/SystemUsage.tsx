import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";

interface SystemUsageProps {
  data?: {
    status:
      | "오류 보고됨"
      | "오류 없음"
      | "점검 필요"
      | "정상 작동"
      | "QR 스캔 동작"
      | "최근 활동";
    count: number;
  }[];
}

export function SystemUsage({ data = [] }: SystemUsageProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "오류 보고됨":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "오류 없음":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "점검 필요":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "정상 작동":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "QR 스캔 동작":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "최근 활동":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (data.length === 0) {
    return (
      <ChartCard
        title="시스템 활동 요약"
        description="오늘의 주요 활동 현황"
        icon={Activity}
        variant="warning"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          데이터가 없습니다
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="시스템 활동 요약"
      description="오늘의 주요 활동 현황"
      icon={Activity}
      variant="warning"
    >
      <div className="grid gap-4 h-80">
        {(data || []).map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
          >
            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
            <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
              {item.count}건
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
