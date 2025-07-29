import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  User,
  Globe,
  Monitor,
  Calendar,
  Activity,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { LABELS } from "@/lib/constants/management";
import type { SystemLog } from "@/lib/types/system";

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

interface LogDetailModalProps {
  log: SystemLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogDetailModal({ log, isOpen, onClose }: LogDetailModalProps) {
  if (!log) return null;

  const levelConfig =
    LOG_LEVEL_CONFIG[log.level === "warn" ? "warning" : log.level] ||
    LOG_LEVEL_CONFIG.info;
  const Icon = levelConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[900px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            {LABELS.LOG_DETAIL_TITLE}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            {LABELS.LOG_DETAIL_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-10rem)]">
          <div className="space-y-3 sm:space-y-4 md:space-y-6 pr-2 sm:pr-4">
            {/* 기본 정보 */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2">
                <Badge
                  variant="outline"
                  className={`${levelConfig.className} text-xs sm:text-sm`}
                >
                  <Icon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  {levelConfig.label}
                </Badge>
                {log.resource_type && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {LABELS.LOG_CATEGORY_LABELS[
                      log.resource_type as keyof typeof LABELS.LOG_CATEGORY_LABELS
                    ] || log.resource_type}
                  </Badge>
                )}
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1" />
                  <span className="break-all">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 md:p-4 bg-muted rounded-lg">
                <p className="text-sm sm:text-base font-medium break-words whitespace-pre-wrap">
                  {log.message}
                </p>
              </div>
            </div>

            <Separator className="my-2 sm:my-3 md:my-4" />

            {/* 사용자 정보 */}
            {(log.user_email || log.user_ip || log.user_agent) && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  {LABELS.USER_INFO}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {log.user_email && (
                    <div className="p-2 sm:p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium text-sm sm:text-base">
                        {LABELS.EMAIL}
                      </span>
                      <p className="font-medium mt-1 break-all text-sm sm:text-base">
                        {log.user_email}
                      </p>
                    </div>
                  )}
                  {log.user_ip && (
                    <div className="p-2 sm:p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground font-medium text-sm sm:text-base">
                        {LABELS.IP_ADDRESS}
                      </span>
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mt-1">
                        <Globe className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                        <span className="font-medium text-sm sm:text-base">
                          {log.user_ip}
                        </span>
                      </div>
                    </div>
                  )}
                  {log.user_agent && (
                    <div className="p-2 sm:p-3 bg-muted rounded-lg col-span-full">
                      <span className="text-muted-foreground font-medium text-sm sm:text-base">
                        {LABELS.USER_AGENT}
                      </span>
                      <div className="flex items-start gap-1 sm:gap-1.5 md:gap-2 mt-1">
                        <Monitor className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 mt-0.5 flex-shrink-0" />
                        <span className="font-medium break-all text-sm sm:text-base">
                          {log.user_agent}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 리소스 정보 */}
            {(log.resource_type || log.resource_id) && (
              <>
                <Separator className="my-2 sm:my-3 md:my-4" />
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="text-sm sm:text-base font-medium flex items-center gap-2">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                    {LABELS.RESOURCE_INFO}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    {log.resource_type && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground font-medium text-sm sm:text-base">
                          {LABELS.RESOURCE_TYPE}
                        </span>
                        <p className="font-medium mt-1 text-sm sm:text-base">
                          {LABELS.LOG_CATEGORY_LABELS[
                            log.resource_type as keyof typeof LABELS.LOG_CATEGORY_LABELS
                          ] || log.resource_type}
                        </p>
                      </div>
                    )}
                    {log.resource_id && (
                      <div className="p-2 sm:p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground font-medium text-sm sm:text-base">
                          {LABELS.RESOURCE_ID}
                        </span>
                        <p className="font-medium mt-1 break-all text-sm sm:text-base">
                          {log.resource_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 추가 정보 */}
            {log.metadata && (
              <>
                <Separator className="my-2 sm:my-3 md:my-4" />
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="text-sm sm:text-base font-medium flex items-center gap-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                    {LABELS.ADDITIONAL_INFO}
                  </h4>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
