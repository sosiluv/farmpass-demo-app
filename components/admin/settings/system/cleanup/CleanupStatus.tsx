import { Label } from "@/components/ui/label";
import type { CleanupStatus as CleanupStatusType } from "@/lib/types/settings";

interface CleanupStatusProps {
  cleanupStatus: CleanupStatusType;
}

export function CleanupStatus({ cleanupStatus }: CleanupStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">만료된 시스템 로그</Label>
        <div className="p-3 bg-muted rounded-lg">
          <p
            className={`text-2xl font-bold ${
              cleanupStatus.expiredData.systemLogs.count === 0
                ? "text-green-600"
                : "text-orange-600"
            }`}
          >
            {cleanupStatus.expiredData.systemLogs.count.toLocaleString()}건
          </p>
          <p className="text-sm text-muted-foreground">
            {cleanupStatus.expiredData.systemLogs.count === 0 ? (
              "정리할 만료된 로그가 없습니다"
            ) : (
              <>
                {new Date(
                  cleanupStatus.expiredData.systemLogs.cutoffDate
                ).toLocaleDateString("ko-KR")}{" "}
                이전 로그
              </>
            )}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">만료된 방문자 데이터</Label>
        <div className="p-3 bg-muted rounded-lg">
          <p
            className={`text-2xl font-bold ${
              cleanupStatus.expiredData.visitorEntries.count === 0
                ? "text-green-600"
                : "text-blue-600"
            }`}
          >
            {cleanupStatus.expiredData.visitorEntries.count.toLocaleString()}건
          </p>
          <p className="text-sm text-muted-foreground">
            {cleanupStatus.expiredData.visitorEntries.count === 0 ? (
              "정리할 만료된 데이터가 없습니다"
            ) : (
              <>
                {new Date(
                  cleanupStatus.expiredData.visitorEntries.cutoffDate
                ).toLocaleDateString("ko-KR")}{" "}
                이전 데이터
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
