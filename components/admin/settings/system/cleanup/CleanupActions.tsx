import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import type { CleanupStatus } from "@/lib/types/settings";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";

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
  const totalExpiredCount =
    cleanupStatus.expiredData.systemLogs.count +
    cleanupStatus.expiredData.visitorEntries.count;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="flex-1"
            disabled={
              cleanupLoading || cleanupStatus.expiredData.systemLogs.count === 0
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {BUTTONS.CLEANUP_SYSTEM_LOGS_BUTTON}
            {cleanupStatus.expiredData.systemLogs.count > 0 && (
              <Badge variant="secondary" className="ml-2">
                {LABELS.COUNT_UNIT.replace(
                  "{count}",
                  cleanupStatus.expiredData.systemLogs.count.toString()
                )}
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {PAGE_HEADER.CLEANUP_SYSTEM_LOGS_CONFIRM_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  <strong className="text-orange-600">
                    {LABELS.COUNT_UNIT.replace(
                      "{count}",
                      cleanupStatus.expiredData.systemLogs.count.toLocaleString()
                    )}
                  </strong>
                  의 만료된 시스템 로그가 삭제됩니다.
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-700">
                      <div className="font-medium mb-1">
                        {LABELS.CLEANUP_DELETE_DATA_TITLE}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          {LABELS.CLEANUP_SYSTEM_LOGS_DELETE.replace(
                            "{date}",
                            new Date(
                              cleanupStatus.expiredData.systemLogs.cutoffDate
                            ).toLocaleDateString("ko-KR")
                          )}
                        </li>
                        <li>{LABELS.CLEANUP_IRRECOVERABLE}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleanupLoading}>
              {BUTTONS.CLEANUP_CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onCleanupRequest("system_logs")}
              disabled={cleanupLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {cleanupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {BUTTONS.CLEANUP_CLEANING}
                </>
              ) : (
                BUTTONS.CLEANUP_DELETE
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={
              cleanupLoading ||
              (cleanupStatus.expiredData.systemLogs.count === 0 &&
                cleanupStatus.expiredData.visitorEntries.count === 0)
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {BUTTONS.CLEANUP_ALL_DATA_BUTTON}
            {totalExpiredCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {LABELS.COUNT_UNIT.replace(
                  "{count}",
                  totalExpiredCount.toString()
                )}
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {PAGE_HEADER.CLEANUP_ALL_DATA_CONFIRM_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  {PAGE_HEADER.CLEANUP_ALL_DATA_CONFIRM_DESC}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <div className="font-medium mb-1">
                        {LABELS.CLEANUP_DELETE_DATA_TITLE}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          {LABELS.CLEANUP_VISITOR_DATA_DELETE.replace(
                            "{count}",
                            cleanupStatus.expiredData.visitorEntries.count.toLocaleString()
                          )}
                        </li>
                        <li>
                          {LABELS.CLEANUP_ALL_DATA_DELETE.replace(
                            "{date}",
                            new Date(
                              cleanupStatus.expiredData.systemLogs.cutoffDate
                            ).toLocaleDateString("ko-KR")
                          )}
                        </li>
                        <li>{LABELS.CLEANUP_IRRECOVERABLE}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleanupLoading}>
              {BUTTONS.CLEANUP_CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onCleanupRequest("all")}
              disabled={cleanupLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {cleanupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {BUTTONS.CLEANUP_CLEANING}
                </>
              ) : (
                BUTTONS.CLEANUP_DELETE
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
