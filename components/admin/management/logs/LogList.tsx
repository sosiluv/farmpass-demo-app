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
import { LABELS } from "@/lib/constants/management";
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
        return (
          <Activity className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-500" />
        );
      case "warn":
        return (
          <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-yellow-500" />
        );
      case "error":
        return (
          <XCircle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-red-500" />
        );
      case "debug":
        return (
          <Activity className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-gray-500" />
        );
      default:
        return (
          <Activity className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-gray-500" />
        );
    }
  };

  const getLogLevelText = (level: string) => {
    const labels = {
      info: LABELS.INFO,
      warn: LABELS.WARN,
      error: LABELS.ERROR,
      debug: LABELS.DEBUG,
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
              <div className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center">
                {getLogLevelIcon(log.level)}
              </div>
            }
            primary={log.action}
            secondary={
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block break-words whitespace-pre-wrap max-w-full text-xs sm:text-sm lg:text-base xl:text-lg text-muted-foreground cursor-help">
                      {log.message}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-md">
                    <p className="whitespace-pre-wrap break-words">
                      {log.message}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
            meta={
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block break-words whitespace-pre-wrap max-w-full text-xs sm:text-sm lg:text-base xl:text-lg text-muted-foreground cursor-help">
                      {`${
                        log.user_email || LABELS.SYSTEM_LABEL
                      } / ${formatDateTime(log.created_at)} / ${
                        log.user_ip || "-"
                      }`}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-md">
                    <p className="whitespace-pre-wrap break-words">
                      {`${
                        log.user_email || LABELS.SYSTEM_LABEL
                      } / ${formatDateTime(log.created_at)} / ${
                        log.user_ip || "-"
                      }`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
            badges={
              <Badge
                className={`${getLogLevelColor(
                  log.level
                )} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}
              >
                {getLogLevelText(log.level)}
              </Badge>
            }
            actions={
              <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-12 sm:w-12 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                        onClick={() => onShowDetails(log)}
                      >
                        <Eye className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{LABELS.DETAIL_INFO_VIEW}</p>
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 sm:h-12 sm:w-12 rounded-full"
                          onClick={() => onDeleteLog(log.id)}
                        >
                          <Trash2 className="h-4 w-4 sm:h-6 sm:w-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{LABELS.DELETE_LOG}</p>
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
          <p>{LABELS.NO_LOGS}</p>
        </div>
      )}
    </CommonListWrapper>
  );
}
