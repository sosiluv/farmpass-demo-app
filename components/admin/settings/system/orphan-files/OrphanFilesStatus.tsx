import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { OrphanFilesStatus as OrphanFilesStatusType } from "@/lib/types/settings";

interface OrphanFilesStatusProps {
  orphanFilesStatus: OrphanFilesStatusType;
}

export function OrphanFilesStatus({
  orphanFilesStatus,
}: OrphanFilesStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">방문자 이미지</Label>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          {/* Storage orphan 표시 */}
          <div className="flex flex-col mb-2">
            <div>
              <Badge
                variant={
                  orphanFilesStatus.visitorOrphanCount > 0
                    ? "destructive"
                    : "default"
                }
              >
                Storage orphan {orphanFilesStatus.visitorOrphanCount}개
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.visitorOrphanCount === 0
                ? "정리할 Storage orphan 파일이 없습니다"
                : "Storage에는 있는데 DB에는 없는 방문자 이미지"}
            </span>
          </div>
          {/* DB orphan 표시 */}
          <div className="flex flex-col mt-2">
            <div>
              <Badge
                variant={
                  orphanFilesStatus.visitorDbOrphanCount > 0
                    ? "destructive"
                    : "default"
                }
              >
                DB orphan {orphanFilesStatus.visitorDbOrphanCount}개
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.visitorDbOrphanCount === 0
                ? "정리할 DB orphan 파일이 없습니다"
                : "DB에는 있는데 Storage에는 없는 방문자 이미지"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">프로필 이미지</Label>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          {/* Storage orphan 표시 */}
          <div className="flex flex-col mb-2">
            <div>
              <Badge
                variant={
                  orphanFilesStatus.profileOrphanCount > 0
                    ? "destructive"
                    : "default"
                }
              >
                Storage orphan {orphanFilesStatus.profileOrphanCount}개
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.profileOrphanCount === 0
                ? "정리할 Storage orphan 파일이 없습니다"
                : "Storage에는 있는데 DB에는 없는 프로필 이미지"}
            </span>
          </div>
          {/* DB orphan 표시 */}
          <div className="flex flex-col mt-2">
            <div>
              <Badge
                variant={
                  orphanFilesStatus.profileDbOrphanCount > 0
                    ? "destructive"
                    : "default"
                }
              >
                DB orphan {orphanFilesStatus.profileDbOrphanCount}개
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.profileDbOrphanCount === 0
                ? "정리할 DB orphan 파일이 없습니다"
                : "DB에는 있는데 Storage에는 없는 프로필 이미지"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
