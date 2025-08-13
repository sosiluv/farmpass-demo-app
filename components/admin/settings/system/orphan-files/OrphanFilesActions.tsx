import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileX, Loader2 } from "lucide-react";
import { useState } from "react";
import type { OrphanFilesStatus } from "@/lib/types/settings";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";
import { WarningConfirmSheet } from "@/components/ui/confirm-sheet";

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
  const [cleanupOpen, setCleanupOpen] = useState(false);

  const totalOrphanCount =
    (orphanFilesStatus.visitorOrphanCount || 0) +
    (orphanFilesStatus.profileOrphanCount || 0) +
    (orphanFilesStatus.visitorDbOrphanCount || 0) +
    (orphanFilesStatus.profileDbOrphanCount || 0);

  const handleCleanup = () => {
    onCleanupRequest();
    setCleanupOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="destructive"
        className="flex-1 text-sm sm:text-base"
        disabled={orphanFilesLoading || totalOrphanCount === 0}
        onClick={() => setCleanupOpen(true)}
      >
        {orphanFilesLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {BUTTONS.ORPHAN_FILES_CLEANUP_BUTTON}
          </>
        ) : (
          <>
            <FileX className="h-4 w-4 mr-2" />
            {BUTTONS.ORPHAN_FILES_CLEANUP_BUTTON}
          </>
        )}
        {totalOrphanCount > 0 && (
          <Badge variant="secondary" className="ml-2 text-sm sm:text-base">
            {LABELS.COUNT_UNIT.replace("{count}", totalOrphanCount.toString())}
          </Badge>
        )}
      </Button>

      {/* 고아 파일 정리 확인 시트 */}
      <WarningConfirmSheet
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        onConfirm={handleCleanup}
        isLoading={orphanFilesLoading}
        title={PAGE_HEADER.ORPHAN_FILES_CLEANUP_CONFIRM_TITLE}
        description={PAGE_HEADER.ORPHAN_FILES_CLEANUP_CONFIRM_DESC.replace(
          "{count}",
          totalOrphanCount.toString()
        )}
        warningMessage={`${
          LABELS.ORPHAN_FILES_DELETE_FILES_TITLE
        }\n• ${LABELS.ORPHAN_FILES_VISITOR_IMAGES_DELETE.replace(
          "{count}",
          orphanFilesStatus.visitorOrphanCount.toString()
        )}\n• ${LABELS.ORPHAN_FILES_VISITOR_DB_ORPHAN_DELETE.replace(
          "{count}",
          orphanFilesStatus.visitorDbOrphanCount.toString()
        )}\n• ${LABELS.ORPHAN_FILES_PROFILE_IMAGES_DELETE.replace(
          "{count}",
          orphanFilesStatus.profileOrphanCount.toString()
        )}\n• ${LABELS.ORPHAN_FILES_PROFILE_DB_ORPHAN_DELETE.replace(
          "{count}",
          orphanFilesStatus.profileDbOrphanCount.toString()
        )}\n• ${LABELS.ORPHAN_FILES_IRRECOVERABLE}`}
      />
    </div>
  );
}
