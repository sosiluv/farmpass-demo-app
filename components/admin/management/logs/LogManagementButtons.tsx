import { Button } from "@/components/ui/button";
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
import { Trash2, AlertTriangle } from "lucide-react";
import { memo, useCallback } from "react";

interface LogManagementButtonsProps {
  logsCount: number;
  onDeleteOldLogs: () => void;
  onDeleteAllLogs: () => void;
}

const WarningIcon = memo(() => (
  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
));
WarningIcon.displayName = "WarningIcon";

const DeleteOldLogsDialog = memo(
  ({ onDeleteOldLogs }: { onDeleteOldLogs: () => void }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200 h-8 px-3 text-xs"
        >
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">30일 이전 로그 삭제</span>
          <span className="sm:hidden">30일 전</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>30일 이전 로그 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="text-sm">
                <strong className="text-orange-600">주의:</strong> 30일 이전의
                모든 시스템 로그가 삭제됩니다.
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <WarningIcon />
                  <div className="text-sm text-orange-700">
                    <div className="font-medium mb-1">삭제될 내용:</div>
                    <div className="pl-4">
                      <ul className="list-disc space-y-1 text-xs">
                        <li>30일 이전에 생성된 모든 시스템 로그</li>
                        <li>삭제된 로그는 복구할 수 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                정말로 30일 이전 시스템 로그를 삭제하시겠습니까?
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteOldLogs}
            className="bg-orange-600 hover:bg-orange-700"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
);
DeleteOldLogsDialog.displayName = "DeleteOldLogsDialog";

const DeleteAllLogsDialog = memo(
  ({
    logsCount,
    onDeleteAllLogs,
  }: {
    logsCount: number;
    onDeleteAllLogs: () => void;
  }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="h-8 px-3 text-xs">
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">전체 로그 삭제</span>
          <span className="sm:hidden">전체 삭제</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>완전 로그 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="text-sm">
                <strong className="text-red-600">경고:</strong> 모든 시스템
                로그가 완전히 삭제됩니다.
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <div className="font-medium mb-1">삭제될 내용:</div>
                    <div className="pl-4">
                      <ul className="list-disc space-y-1 text-xs">
                        <li>모든 시스템 로그 ({logsCount}개)</li>
                        <li>모든 사용자 활동 기록</li>
                        <li>모든 농장 관리 기록</li>
                        <li>모든 시스템 오류 기록</li>
                        <li className="text-red-600 font-medium">
                          ⚠️ 복구 불가능 - 완전 삭제
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                정말로 모든 시스템 로그를 완전히 삭제하시겠습니까?{" "}
                <strong className="text-red-600">
                  이 작업은 되돌릴 수 없습니다!
                </strong>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteAllLogs}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            완전 삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
);
DeleteAllLogsDialog.displayName = "DeleteAllLogsDialog";

export const LogManagementButtons = memo(
  ({
    logsCount,
    onDeleteOldLogs,
    onDeleteAllLogs,
  }: LogManagementButtonsProps) => {
    const handleDeleteOldLogs = useCallback(() => {
      onDeleteOldLogs();
    }, [onDeleteOldLogs]);

    const handleDeleteAllLogs = useCallback(() => {
      onDeleteAllLogs();
    }, [onDeleteAllLogs]);

    return (
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1 sm:gap-2">
          <DeleteOldLogsDialog onDeleteOldLogs={handleDeleteOldLogs} />
          <DeleteAllLogsDialog
            logsCount={logsCount}
            onDeleteAllLogs={handleDeleteAllLogs}
          />
        </div>
      </div>
    );
  }
);

LogManagementButtons.displayName = "LogManagementButtons";
