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
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { memo, useCallback } from "react";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/management";

interface LogManagementButtonsProps {
  logsCount: number;
  onDeleteOldLogs: () => void;
  onDeleteAllLogs: () => void;
  isLoading?: boolean;
}

const WarningIcon = memo(() => (
  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
));
WarningIcon.displayName = "WarningIcon";

const DeleteOldLogsDialog = memo(
  ({
    onDeleteOldLogs,
    isLoading = false,
  }: {
    onDeleteOldLogs: () => void;
    isLoading?: boolean;
  }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200 h-8 px-3 text-xs"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">{BUTTONS.DELETING}</span>
              <span className="sm:hidden">{BUTTONS.DELETING}</span>
            </>
          ) : (
            <>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {BUTTONS.DELETE_OLD_LOGS_30_DAYS}
              </span>
              <span className="sm:hidden">
                {BUTTONS.DELETE_OLD_LOGS_30_DAYS_MOBILE}
              </span>
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {PAGE_HEADER.DELETE_OLD_LOGS_CONFIRM_TITLE}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="text-sm">
                <strong className="text-orange-600">{LABELS.WARNING}</strong>{" "}
                {LABELS.OLD_LOGS_WARNING}
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <WarningIcon />
                  <div className="text-sm text-orange-700">
                    <div className="font-medium mb-1">
                      {LABELS.DELETED_CONTENT}
                    </div>
                    <div className="pl-4">
                      <ul className="list-disc space-y-1 text-xs">
                        <li>{LABELS.OLD_LOGS_DELETED}</li>
                        <li>{LABELS.DELETED_LOGS_IRRECOVERABLE}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {LABELS.CONFIRM_OLD_LOGS_DELETE}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {BUTTONS.CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteOldLogs}
            className="bg-orange-600 hover:bg-orange-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {BUTTONS.DELETING}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {BUTTONS.DELETE}
              </>
            )}
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
    isLoading = false,
  }: {
    logsCount: number;
    onDeleteAllLogs: () => void;
    isLoading?: boolean;
  }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">{BUTTONS.DELETING}</span>
              <span className="sm:hidden">{BUTTONS.DELETING}</span>
            </>
          ) : (
            <>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {BUTTONS.DELETE_ALL_LOGS}
              </span>
              <span className="sm:hidden">
                {BUTTONS.DELETE_ALL_LOGS_MOBILE}
              </span>
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {PAGE_HEADER.DELETE_ALL_LOGS_CONFIRM_TITLE}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="text-sm">
                <strong className="text-red-600">{LABELS.CAUTION}</strong>{" "}
                {LABELS.ALL_LOGS_WARNING}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <div className="font-medium mb-1">
                      {LABELS.DELETED_CONTENT}
                    </div>
                    <div className="pl-4">
                      <ul className="list-disc space-y-1 text-xs">
                        <li>
                          {LABELS.ALL_SYSTEM_LOGS} ({logsCount}개)
                        </li>
                        <li>{LABELS.ALL_USER_ACTIVITY}</li>
                        <li>{LABELS.ALL_FARM_MANAGEMENT}</li>
                        <li>{LABELS.ALL_SYSTEM_ERRORS}</li>
                        <li className="text-red-600 font-medium">
                          {LABELS.IRRECOVERABLE_DELETE}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {LABELS.CONFIRM_ALL_LOGS_DELETE}{" "}
                <strong className="text-red-600">
                  {LABELS.IRREVERSIBLE_ACTION}
                </strong>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {BUTTONS.CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteAllLogs}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {BUTTONS.DELETING}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {BUTTONS.COMPLETE_DELETE}
              </>
            )}
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
    isLoading = false,
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
          <DeleteOldLogsDialog
            onDeleteOldLogs={handleDeleteOldLogs}
            isLoading={isLoading}
          />
          <DeleteAllLogsDialog
            logsCount={logsCount}
            onDeleteAllLogs={handleDeleteAllLogs}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }
);
LogManagementButtons.displayName = "LogManagementButtons";
