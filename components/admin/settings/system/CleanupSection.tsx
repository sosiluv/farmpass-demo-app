import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import type { CleanupStatus } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import {
  CleanupStatus as CleanupStatusComponent,
  CleanupSuccessMessage,
  CleanupActions,
} from "./cleanup";

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
        title="로그 정리 관리"
        description="만료된 시스템 로그와 방문자 데이터를 수동으로 정리할 수 있습니다"
      />
      <CardContent className="space-y-6">
        {statusLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              정리 상태를 확인하는 중...
            </p>
          </div>
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
