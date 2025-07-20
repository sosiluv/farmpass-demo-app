import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";
import { LABELS } from "@/lib/constants/management";

interface SystemUsageProps {
  data?: {
    status:
      | typeof LABELS.ERROR_REPORTED
      | typeof LABELS.NO_ERROR
      | typeof LABELS.INSPECTION_NEEDED
      | typeof LABELS.NORMAL_OPERATION
      | typeof LABELS.QR_SCAN_ACTIVE
      | typeof LABELS.RECENT_ACTIVITY;
    count: number;
  }[];
}

export function SystemUsage({ data = [] }: SystemUsageProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case LABELS.ERROR_REPORTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case LABELS.NO_ERROR:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case LABELS.INSPECTION_NEEDED:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case LABELS.NORMAL_OPERATION:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case LABELS.QR_SCAN_ACTIVE:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case LABELS.RECENT_ACTIVITY:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (data.length === 0) {
    return (
      <ChartCard
        title={LABELS.SYSTEM_ACTIVITY_SUMMARY}
        description={LABELS.SYSTEM_ACTIVITY_SUMMARY_DESC}
        icon={Activity}
        variant="warning"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {LABELS.NO_DATA}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={LABELS.SYSTEM_ACTIVITY_SUMMARY}
      description={LABELS.SYSTEM_ACTIVITY_SUMMARY_DESC}
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
              {LABELS.COUNT_UNIT.replace("{count}", item.count.toString())}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
