import { formatDateTime } from "@/lib/utils/datetime/date";
import {
  UserCog,
  Activity,
  FileText,
  QrCode,
  AlertCircle,
  Settings,
  Bell,
  AlertTriangle,
  Building2,
  Clock,
  Users,
  Database,
} from "lucide-react";
import { ChartCard } from "@/components/common/ChartCard";

interface Activity {
  id: string;
  type: string;
  timestamp: string;
  details: string;
  userName?: string;
}

interface RecentActivitiesProps {
  activities?: Activity[];
}

export function RecentActivities({ activities = [] }: RecentActivitiesProps) {
  const getActivityIcon = (type: string) => {
    // 전체 action 값으로 먼저 확인
    switch (type) {
      case "ADMIN_COMPONENT_ERROR":
        return <AlertCircle className="h-4 w-4" />;
    }

    // action 값에서 접두사 추출
    const prefix = type?.split("_")[0] || "";

    // 기본 아이콘 매핑
    switch (prefix) {
      case "ADMIN":
        return <Settings className="h-4 w-4" />;
      case "USER":
        return <UserCog className="h-4 w-4" />;
      case "FARM":
        return <Building2 className="h-4 w-4" />;
      case "VISITOR":
        return <Users className="h-4 w-4" />;
      case "SYSTEM":
        return <Settings className="h-4 w-4" />;
      case "FILE":
        return <FileText className="h-4 w-4" />;
      case "DATA":
        return <Database className="h-4 w-4" />;
      case "NOTIFICATION":
        return <Bell className="h-4 w-4" />;
      case "QR":
        return <QrCode className="h-4 w-4" />;
      case "ERROR":
        return <AlertCircle className="h-4 w-4" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    // 전체 action 값으로 먼저 확인
    switch (type) {
      case "ADMIN_COMPONENT_ERROR":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    }

    // action 값에서 접두사 추출
    const prefix = type?.split("_")[0] || "";

    // 기본 색상 매핑
    switch (prefix) {
      case "ADMIN":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "USER":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "FARM":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "VISITOR":
        return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "SYSTEM":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "FILE":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";
      case "DATA":
        return "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400";
      case "NOTIFICATION":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "QR":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
      case "ERROR":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "WARNING":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <ChartCard
      title="최근 활동"
      description="최근 시스템 활동 내역"
      icon={Clock}
      variant="info"
    >
      <div className="space-y-2 sm:space-y-3 lg:space-y-4 overflow-y-auto h-80">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-2 sm:gap-3 lg:gap-4 border-b border-slate-200 dark:border-slate-700 pb-2 sm:pb-3 lg:pb-4 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 transition-colors duration-200"
          >
            <div
              className={`mt-0.5 p-1.5 sm:p-2 lg:p-2.5 rounded-full ${getActivityColor(
                activity.type
              )}`}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-0.5 sm:space-y-1 lg:space-y-1.5">
              <p className="text-xs sm:text-sm lg:text-base font-medium text-slate-900 dark:text-slate-100">
                {activity.details}
              </p>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                {activity.userName && (
                  <>
                    <span className="font-medium">{activity.userName}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatDateTime(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-xs sm:text-sm lg:text-base text-muted-foreground py-3 sm:py-4 lg:py-6">
            최근 활동이 없습니다.
          </div>
        )}
      </div>
    </ChartCard>
  );
}
