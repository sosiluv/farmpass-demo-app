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
            시스템 로그 정리
            {cleanupStatus.expiredData.systemLogs.count > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cleanupStatus.expiredData.systemLogs.count}개
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시스템 로그 정리 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  <strong className="text-orange-600">
                    {cleanupStatus.expiredData.systemLogs.count.toLocaleString()}
                    건
                  </strong>
                  의 만료된 시스템 로그가 삭제됩니다.
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-700">
                      <div className="font-medium mb-1">삭제될 데이터:</div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          {new Date(
                            cleanupStatus.expiredData.systemLogs.cutoffDate
                          ).toLocaleDateString("ko-KR")}{" "}
                          이전의 모든 시스템 로그
                        </li>
                        <li>삭제된 로그는 복구할 수 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleanupLoading}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onCleanupRequest("system_logs")}
              disabled={cleanupLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {cleanupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  정리 중...
                </>
              ) : (
                "삭제"
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
            모든 만료 데이터 정리
            {totalExpiredCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalExpiredCount}개
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>전체 데이터 정리 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  만료된 <strong className="text-red-600">모든 데이터</strong>가
                  삭제됩니다.
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <div className="font-medium mb-1">삭제될 데이터:</div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          시스템 로그:{" "}
                          {cleanupStatus.expiredData.systemLogs.count.toLocaleString()}
                          건
                        </li>
                        <li>
                          방문자 데이터:{" "}
                          {cleanupStatus.expiredData.visitorEntries.count.toLocaleString()}
                          건
                        </li>
                        <li>
                          {new Date(
                            cleanupStatus.expiredData.systemLogs.cutoffDate
                          ).toLocaleDateString("ko-KR")}{" "}
                          이전의 모든 데이터
                        </li>
                        <li>삭제된 데이터는 복구할 수 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleanupLoading}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onCleanupRequest("all")}
              disabled={cleanupLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {cleanupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  정리 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
