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
            <FileX className="h-4 w-4 mr-2" />
            Orphan 파일 정리
            {totalOrphanCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalOrphanCount}개
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Orphan 파일 정리 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  사용되지 않는{" "}
                  <strong className="text-red-600">{totalOrphanCount}개</strong>
                  의 이미지 파일이 삭제됩니다.
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-700">
                    <div className="font-medium mb-1">삭제될 파일:</div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        방문자 이미지: {orphanFilesStatus.visitorOrphanCount}개
                      </li>
                      <li>
                        방문자 DB orphan:{" "}
                        {orphanFilesStatus.visitorDbOrphanCount}개
                      </li>
                      <li>
                        프로필 이미지: {orphanFilesStatus.profileOrphanCount}개
                      </li>
                      <li>
                        프로필 DB orphan:{" "}
                        {orphanFilesStatus.profileDbOrphanCount}개
                      </li>
                      <li>삭제된 파일은 복구할 수 없습니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={orphanFilesLoading}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onCleanupRequest}
              disabled={orphanFilesLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {orphanFilesLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
