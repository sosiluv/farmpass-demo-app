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
import { FileX, Loader2 } from "lucide-react";
import type { OrphanFilesStatus } from "@/lib/types/settings";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";

interface OrphanFilesActionsProps {
  orphanFilesStatus: OrphanFilesStatus;
  orphanFilesLoading: boolean;
  onCleanupRequest: () => void;
}

export function OrphanFilesActions({
  orphanFilesStatus,
  orphanFilesLoading,
  onCleanupRequest,
}: OrphanFilesActionsProps) {
  const totalOrphanCount =
    (orphanFilesStatus.visitorOrphanCount || 0) +
    (orphanFilesStatus.profileOrphanCount || 0) +
    (orphanFilesStatus.visitorDbOrphanCount || 0) +
    (orphanFilesStatus.profileDbOrphanCount || 0);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={orphanFilesLoading || totalOrphanCount === 0}
          >
            {orphanFilesLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <FileX className="h-4 w-4 mr-2" />
            {BUTTONS.ORPHAN_FILES_CLEANUP_BUTTON}
            {totalOrphanCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalOrphanCount}개
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {PAGE_HEADER.ORPHAN_FILES_CLEANUP_CONFIRM_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  {PAGE_HEADER.ORPHAN_FILES_CLEANUP_CONFIRM_DESC.replace(
                    "{count}",
                    totalOrphanCount.toString()
                  )}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-700">
                    <div className="font-medium mb-1">
                      {LABELS.ORPHAN_FILES_DELETE_FILES_TITLE}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        {LABELS.ORPHAN_FILES_VISITOR_IMAGES_DELETE.replace(
                          "{count}",
                          orphanFilesStatus.visitorOrphanCount.toString()
                        )}
                      </li>
                      <li>
                        {LABELS.ORPHAN_FILES_VISITOR_DB_ORPHAN_DELETE.replace(
                          "{count}",
                          orphanFilesStatus.visitorDbOrphanCount.toString()
                        )}
                      </li>
                      <li>
                        {LABELS.ORPHAN_FILES_PROFILE_IMAGES_DELETE.replace(
                          "{count}",
                          orphanFilesStatus.profileOrphanCount.toString()
                        )}
                      </li>
                      <li>
                        {LABELS.ORPHAN_FILES_PROFILE_DB_ORPHAN_DELETE.replace(
                          "{count}",
                          orphanFilesStatus.profileDbOrphanCount.toString()
                        )}
                      </li>
                      <li>{LABELS.ORPHAN_FILES_IRRECOVERABLE}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={orphanFilesLoading}>
              {BUTTONS.CLEANUP_CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onCleanupRequest}
              disabled={orphanFilesLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {orphanFilesLoading ? (
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
