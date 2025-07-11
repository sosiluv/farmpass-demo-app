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
        title="Orphan 파일 정리"
        description="사용되지 않는 이미지 파일을 정리하여 저장공간을 확보합니다"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            disabled={orphanFilesLoading || statusLoading}
          >
            <RotateCcw
              className={`h-4 w-4 mr-2 ${statusLoading ? "animate-spin" : ""}`}
            />
            새로고침
          </Button>
        }
      />
      <CardContent className="space-y-6">
        {statusLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Orphan 파일 상태를 확인하는 중...
            </p>
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
