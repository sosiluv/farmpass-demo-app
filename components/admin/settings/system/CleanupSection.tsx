import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CleanupStatus } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import {
  CleanupStatus as CleanupStatusComponent,
  CleanupSuccessMessage,
  CleanupActions,
} from "./cleanup";
import { Loading } from "@/components/ui/loading";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";

interface CleanupSectionProps {
  cleanupStatus: CleanupStatus | null;
  statusLoading: boolean;
  cleanupLoading: boolean;
  lastCleanupSuccess: string | null;
  onCleanupRequest: (type: "system_logs" | "all") => void;
  onRefreshStatus: () => void;
}

export function CleanupSection({
  cleanupStatus,
  statusLoading,
  cleanupLoading,
  lastCleanupSuccess,
  onCleanupRequest,
  onRefreshStatus,
}: CleanupSectionProps) {
  return (
    <Card>
      <SettingsCardHeader
        icon={Trash2}
        title={PAGE_HEADER.CLEANUP_SECTION_TITLE}
        description={PAGE_HEADER.CLEANUP_SECTION_DESC}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            disabled={cleanupLoading || statusLoading}
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
          <Loading
            text={LABELS.CLEANUP_STATUS_CHECKING}
            minHeight={180}
            spinnerSize={32}
            spinnerColor="text-primary"
            className="py-8 w-full"
          />
        ) : cleanupStatus ? (
          <>
            <CleanupStatusComponent cleanupStatus={cleanupStatus} />
            <Separator />
            <CleanupSuccessMessage
              lastCleanupSuccess={lastCleanupSuccess}
              cleanupStatus={cleanupStatus}
            />
            <CleanupActions
              cleanupStatus={cleanupStatus}
              cleanupLoading={cleanupLoading}
              onCleanupRequest={onCleanupRequest}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
