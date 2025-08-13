import { Sheet } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
} from "@/components/ui/sheet-common";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { LABELS } from "@/lib/constants/management";
import type { SystemLog } from "@/lib/types/common";

type LevelConfig = {
  icon: typeof Info;
  className: string;
  label: string;
};

const LOG_LEVEL_CONFIG: Record<string, LevelConfig> = {
  info: {
    icon: Info,
    className: "bg-blue-100 text-blue-800 border-blue-300",
    label: LABELS.INFO,
  },
  warn: {
    icon: AlertTriangle,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: LABELS.WARN,
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: LABELS.WARN,
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-100 text-red-800 border-red-300",
    label: LABELS.ERROR,
  },
  debug: {
    icon: Info,
    className: "bg-gray-100 text-gray-800 border-gray-300",
    label: LABELS.DEBUG,
  },
  success: {
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-300",
    label: LABELS.SUCCESS,
  },
};

interface LogDetailSheetProps {
  log: SystemLog | null;
  open: boolean;
  onClose: () => void;
}

export function LogDetailSheet({ log, open, onClose }: LogDetailSheetProps) {
  const levelConfig = log
    ? LOG_LEVEL_CONFIG[log.level === "warn" ? "warning" : log.level] ||
      LOG_LEVEL_CONFIG.info
    : LOG_LEVEL_CONFIG.info;
  const Icon = levelConfig.icon;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <CommonSheetContent
        side="bottom"
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={onClose}
      >
        <CommonSheetHeader
          title={LABELS.LOG_DETAIL_TITLE}
          description={LABELS.LOG_DETAIL_DESCRIPTION}
        />
        {log ? (
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-4 pr-2 pb-4">
              {/* 기본 정보 */}
              {log.message && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.MESSAGE}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base break-all">
                      {log.message}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {formatDateTime(log.created_at)}
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`${levelConfig.className} text-xs sm:text-sm`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {levelConfig.label}
                      </Badge>
                      {log.resource_type && (
                        <Badge
                          variant="secondary"
                          className="text-xs sm:text-sm"
                        >
                          {LABELS.LOG_CATEGORY_LABELS[
                            log.resource_type as keyof typeof LABELS.LOG_CATEGORY_LABELS
                          ] || log.resource_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {(log.user_email || log.user_ip || log.user_agent) && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {log.user_email && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <div className="font-medium text-foreground text-sm sm:text-base">
                          {LABELS.EMAIL}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm sm:text-base break-all">
                          {log.user_email}
                        </div>
                      </div>
                    )}
                    {log.user_ip && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <div className="font-medium text-foreground text-sm sm:text-base">
                          {LABELS.IP_ADDRESS}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                          {log.user_ip}
                        </div>
                      </div>
                    )}
                    {log.user_agent && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg col-span-full">
                        <div className="font-medium text-foreground text-sm sm:text-base">
                          {LABELS.USER_AGENT}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm sm:text-base break-all">
                          {log.user_agent}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 리소스 정보 */}
              {(log.resource_type || log.resource_id) && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {log.resource_type && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <div className="font-medium text-foreground text-sm sm:text-base">
                          {LABELS.RESOURCE_TYPE}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                          {LABELS.LOG_CATEGORY_LABELS[
                            log.resource_type as keyof typeof LABELS.LOG_CATEGORY_LABELS
                          ] || log.resource_type}
                        </div>
                      </div>
                    )}
                    {log.resource_id && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <div className="font-medium text-foreground text-sm sm:text-base">
                          {LABELS.RESOURCE_ID}
                        </div>
                        <div className="text-muted-foreground mt-1 text-sm sm:text-base break-all">
                          {log.resource_id}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 추가 정보 */}
              {log.metadata && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.ADDITIONAL_INFO}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      <pre className="font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            {LABELS.NO_LOGS}
          </div>
        )}
      </CommonSheetContent>
    </Sheet>
  );
}
