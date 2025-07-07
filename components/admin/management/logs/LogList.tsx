import { CommonListItem } from "../shared/CommonListItem";
import { Eye, Trash2, Activity, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { SystemLog } from "@/lib/types/system";
import { CommonListWrapper } from "../shared/CommonListWrapper";

interface LogListProps {
  logs: SystemLog[];
  onShowDetails: (log: SystemLog) => void;
  onDeleteLog?: (id: string) => void;
}

export function LogList({ logs, onShowDetails, onDeleteLog }: LogListProps) {
  const getLogLevelColor = (level: string) => {
    const variants = {
      info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      warn: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      debug: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return variants[level as keyof typeof variants] || variants.info;
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />;
      case "warn":
        return (
          <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500" />
        );
      case "error":
        return <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />;
      case "debug":
        return <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500" />;
    }
  };

  const getLogLevelText = (level: string) => {
    const labels = {
      info: "정보",
      warn: "경고",
      error: "오류",
      debug: "디버그",
    };
    return labels[level as keyof typeof labels] || level;
  };

  return (
    <CommonListWrapper>
      {logs.length > 0 ? (
        (logs || []).map((log) => (
          <CommonListItem
            key={log.id}
            avatar={
              <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center">
                {getLogLevelIcon(log.level)}
              </div>
            }
            primary={log.action}
            secondary={
              <span className="max-w-[80px] sm:max-w-[150px] lg:max-w-[800px] xl:max-w-[1000px] 2xl:max-w-[1200px] inline-block align-bottom">
                {log.message}
              </span>
            }
            meta={
              <span className="min-w-0 max-w-[80px] sm:max-w-[200px] lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px] block">
                {`${log.user_email || "시스템"} / ${formatDateTime(
                  log.created_at
                )} / ${log.user_ip || "-"}`}
              </span>
            }
            badges={
              <Badge
                className={`${getLogLevelColor(
                  log.level
                )} text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}
              >
                {getLogLevelText(log.level)}
              </Badge>
            }
            actions={
              <div className="flex items-center gap-3 flex-shrink-0 ml-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                        onClick={() => onShowDetails(log)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>상세 정보 보기</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {onDeleteLog && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 rounded-full"
                          onClick={() => onDeleteLog(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>로그 삭제</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            }
          />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>로그가 없습니다.</p>
        </div>
      )}
    </CommonListWrapper>
  );
}
