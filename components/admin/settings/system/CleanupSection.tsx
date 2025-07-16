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
            새로고침
          </Button>
        }
      />
      <CardContent className="space-y-6">
        {statusLoading ? (
          <Loading
            text="정리 상태를 확인하는 중..."
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
