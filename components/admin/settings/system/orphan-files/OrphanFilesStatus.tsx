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
          <Badge
            variant={
              orphanFilesStatus.visitorOrphanCount > 0
                ? "destructive"
                : "default"
            }
          >
            {orphanFilesStatus.visitorOrphanCount}개
          </Badge>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p
            className={`text-2xl font-bold ${
              orphanFilesStatus.visitorOrphanCount === 0
                ? "text-green-600"
                : "text-orange-600"
            }`}
          >
            {orphanFilesStatus.visitorOrphanCount.toLocaleString()}건
          </p>
          <p className="text-sm text-muted-foreground">
            {orphanFilesStatus.visitorOrphanCount === 0
              ? "정리할 orphan 파일이 없습니다"
              : "사용되지 않는 방문자 이미지"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">프로필 이미지</Label>
          <Badge
            variant={
              orphanFilesStatus.profileOrphanCount > 0
                ? "destructive"
                : "default"
            }
          >
            {orphanFilesStatus.profileOrphanCount}개
          </Badge>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p
            className={`text-2xl font-bold ${
              orphanFilesStatus.profileOrphanCount === 0
                ? "text-green-600"
                : "text-blue-600"
            }`}
          >
            {orphanFilesStatus.profileOrphanCount.toLocaleString()}건
          </p>
          <p className="text-sm text-muted-foreground">
            {orphanFilesStatus.profileOrphanCount === 0
              ? "정리할 orphan 파일이 없습니다"
              : "사용되지 않는 프로필 이미지"}
          </p>
        </div>
      </div>
    </div>
  );
}
