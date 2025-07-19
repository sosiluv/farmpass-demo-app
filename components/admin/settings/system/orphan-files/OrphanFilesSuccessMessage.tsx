import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileX } from "lucide-react";
import type { OrphanFilesStatus } from "@/lib/types/settings";

interface OrphanFilesSuccessMessageProps {
  lastCleanupSuccess: string | null;
  orphanFilesStatus: OrphanFilesStatus;
}

export function OrphanFilesSuccessMessage({
  lastCleanupSuccess,
  orphanFilesStatus,
}: OrphanFilesSuccessMessageProps) {
  if (lastCleanupSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-green-700 font-medium">
            🎉 {lastCleanupSuccess} 정리가 완료되었습니다!
          </p>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Orphan 파일이 성공적으로 정리되었고 상태가 업데이트되었습니다.
        </p>
      </div>
    );
  }

  if (
    !lastCleanupSuccess &&
    orphanFilesStatus.visitorOrphanCount === 0 &&
    orphanFilesStatus.profileOrphanCount === 0
  ) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-700 font-medium">
            ✅ 모든 orphan 파일이 정리되었습니다
          </p>
        </div>
        <p className="text-xs text-green-600 mt-1">
          현재 정리할 orphan 파일이 없습니다. 새로운 이미지 업로드 시 orphan
          파일이 생성될 수 있습니다.
        </p>
      </div>
    );
  }

  return null;
}
