import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import type { CleanupStatus } from "@/lib/types/settings";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";
import { WarningConfirmSheet } from "@/components/ui/confirm-sheet";

interface CleanupActionsProps {
  cleanupStatus: CleanupStatus;
  cleanupLoading: boolean;
  onCleanupRequest: (type: "system_logs" | "all") => void;
}

export function CleanupActions({
  cleanupStatus,
  cleanupLoading,
  onCleanupRequest,
}: CleanupActionsProps) {
  const [systemLogsOpen, setSystemLogsOpen] = useState(false);
  const [allDataOpen, setAllDataOpen] = useState(false);

  const totalExpiredCount =
    cleanupStatus.expiredData.systemLogs.count +
    cleanupStatus.expiredData.visitorEntries.count;

  const handleSystemLogsCleanup = useCallback(() => {
    onCleanupRequest("system_logs");
    setSystemLogsOpen(false);
  }, [onCleanupRequest]);

  const handleAllDataCleanup = useCallback(() => {
    onCleanupRequest("all");
    setAllDataOpen(false);
  }, [onCleanupRequest]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        className="flex-1 text-sm sm:text-base"
        disabled={
          cleanupLoading || cleanupStatus.expiredData.systemLogs.count === 0
        }
        onClick={() => setSystemLogsOpen(true)}
      >
        {cleanupLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {BUTTONS.CLEANUP_SYSTEM_LOGS_BUTTON}
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            {BUTTONS.CLEANUP_SYSTEM_LOGS_BUTTON}
          </>
        )}
        {cleanupStatus.expiredData.systemLogs.count > 0 && (
          <Badge variant="secondary" className="ml-2 text-sm sm:text-base">
            {LABELS.COUNT_UNIT.replace(
              "{count}",
              cleanupStatus.expiredData.systemLogs.count.toString()
            )}
          </Badge>
        )}
      </Button>

      <Button
        variant="destructive"
        className="flex-1 text-sm sm:text-base"
        disabled={
          cleanupLoading ||
          (cleanupStatus.expiredData.systemLogs.count === 0 &&
            cleanupStatus.expiredData.visitorEntries.count === 0)
        }
        onClick={() => setAllDataOpen(true)}
      >
        {cleanupLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {BUTTONS.CLEANUP_ALL_DATA_BUTTON}
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            {BUTTONS.CLEANUP_ALL_DATA_BUTTON}
          </>
        )}
        {totalExpiredCount > 0 && (
          <Badge variant="secondary" className="ml-2 text-sm sm:text-base">
            {LABELS.COUNT_UNIT.replace("{count}", totalExpiredCount.toString())}
          </Badge>
        )}
      </Button>

      {/* 시스템 로그 정리 확인 시트 */}
      <WarningConfirmSheet
        open={systemLogsOpen}
        onOpenChange={setSystemLogsOpen}
        onConfirm={handleSystemLogsCleanup}
        isLoading={cleanupLoading}
        title={PAGE_HEADER.CLEANUP_SYSTEM_LOGS_CONFIRM_TITLE}
        description={`${LABELS.COUNT_UNIT.replace(
          "{count}",
          cleanupStatus.expiredData.systemLogs.count.toLocaleString()
        )}의 만료된 시스템 로그가 삭제됩니다.`}
        warningMessage={`${
          LABELS.CLEANUP_DELETE_DATA_TITLE
        }\n• ${LABELS.CLEANUP_SYSTEM_LOGS_DELETE.replace(
          "{date}",
          new Date(
            cleanupStatus.expiredData.systemLogs.cutoffDate
          ).toLocaleDateString("ko-KR")
        )}\n• ${LABELS.CLEANUP_IRRECOVERABLE}`}
      />

      {/* 전체 데이터 정리 확인 시트 */}
      <WarningConfirmSheet
        open={allDataOpen}
        onOpenChange={setAllDataOpen}
        onConfirm={handleAllDataCleanup}
        isLoading={cleanupLoading}
        title={PAGE_HEADER.CLEANUP_ALL_DATA_CONFIRM_TITLE}
        description={PAGE_HEADER.CLEANUP_ALL_DATA_CONFIRM_DESC}
        warningMessage={`${
          LABELS.CLEANUP_DELETE_DATA_TITLE
        }\n• ${LABELS.CLEANUP_VISITOR_DATA_DELETE.replace(
          "{count}",
          cleanupStatus.expiredData.visitorEntries.count.toLocaleString()
        )}\n• ${LABELS.CLEANUP_ALL_DATA_DELETE.replace(
          "{date}",
          new Date(
            cleanupStatus.expiredData.systemLogs.cutoffDate
          ).toLocaleDateString("ko-KR")
        )}\n• ${LABELS.CLEANUP_IRRECOVERABLE}`}
      />
    </div>
  );
}
