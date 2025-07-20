import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LABELS } from "@/lib/constants/settings";
import type { CleanupStatus as CleanupStatusType } from "@/lib/types/settings";

interface CleanupStatusProps {
  cleanupStatus: CleanupStatusType;
}

export function CleanupStatus({ cleanupStatus }: CleanupStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {LABELS.CLEANUP_SYSTEM_LOGS}
          </Label>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          {/* Badge + 설명 텍스트 한 줄/아래로 */}
          <div className="flex flex-col mb-2">
            <div>
              <Badge
                variant={
                  cleanupStatus.expiredData.systemLogs.count > 0
                    ? "destructive"
                    : "default"
                }
              >
                {cleanupStatus.expiredData.systemLogs.count}개
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {cleanupStatus.expiredData.systemLogs.count === 0
                ? LABELS.CLEANUP_NO_EXPIRED_LOGS
                : LABELS.CLEANUP_BEFORE_DATE.replace(
                    "{date}",
                    new Date(
                      cleanupStatus.expiredData.systemLogs.cutoffDate
                    ).toLocaleDateString("ko-KR")
                  )}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {LABELS.CLEANUP_VISITOR_DATA}
          </Label>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          {/* Badge + 설명 텍스트 한 줄/아래로 */}
          <div className="flex flex-col mb-2">
            <div>
              <Badge
                variant={
                  cleanupStatus.expiredData.visitorEntries.count > 0
                    ? "destructive"
                    : "default"
                }
              >
                {cleanupStatus.expiredData.visitorEntries.count}개
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {cleanupStatus.expiredData.visitorEntries.count === 0
                ? LABELS.CLEANUP_NO_EXPIRED_DATA
                : LABELS.CLEANUP_BEFORE_DATE_DATA.replace(
                    "{date}",
                    new Date(
                      cleanupStatus.expiredData.visitorEntries.cutoffDate
                    ).toLocaleDateString("ko-KR")
                  )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
