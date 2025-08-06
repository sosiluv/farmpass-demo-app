import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrphanFilesStatus } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import {
  OrphanFilesStatus as OrphanFilesStatusComponent,
  OrphanFilesSuccessMessage,
  OrphanFilesActions,
} from "./orphan-files";
import { LottieLoadingCompact } from "@/components/ui/lottie-loading";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";

interface OrphanFilesSectionProps {
  orphanFilesStatus: OrphanFilesStatus | null;
  statusLoading: boolean;
  orphanFilesLoading: boolean;
  lastCleanupSuccess: string | null;
  onCleanupRequest: () => void;
  onRefreshStatus: () => void;
}

export function OrphanFilesSection({
  orphanFilesStatus,
  statusLoading,
  orphanFilesLoading,
  lastCleanupSuccess,
  onCleanupRequest,
  onRefreshStatus,
}: OrphanFilesSectionProps) {
  return (
    <Card>
      <SettingsCardHeader
        icon={FileX}
        title={PAGE_HEADER.ORPHAN_FILES_SECTION_TITLE}
        description={PAGE_HEADER.ORPHAN_FILES_SECTION_DESC}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            disabled={statusLoading}
            className="text-sm sm:text-base"
          >
            <RotateCcw
              className={`h-4 w-4 mr-2 ${statusLoading ? "animate-spin" : ""}`}
            />
            {BUTTONS.CLEANUP_REFRESH_BUTTON}
          </Button>
        }
      />
      <CardContent className="space-y-6">
        {statusLoading ? (
          <div className="flex items-center justify-center py-8">
            <LottieLoadingCompact
              text={LABELS.ORPHAN_FILES_STATUS_CHECKING}
              size="md"
            />
          </div>
        ) : orphanFilesStatus ? (
          <>
            <OrphanFilesStatusComponent orphanFilesStatus={orphanFilesStatus} />
            <Separator />
            <OrphanFilesSuccessMessage
              lastCleanupSuccess={lastCleanupSuccess}
              orphanFilesStatus={orphanFilesStatus}
            />
            <OrphanFilesActions
              orphanFilesStatus={orphanFilesStatus}
              orphanFilesLoading={orphanFilesLoading}
              onCleanupRequest={onCleanupRequest}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
