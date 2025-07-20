import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LABELS } from "@/lib/constants/settings";
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
          <Label className="text-sm font-medium">
            {LABELS.ORPHAN_FILES_VISITOR_IMAGES}
          </Label>
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
                {LABELS.ORPHAN_FILES_STORAGE_ORPHAN.replace(
                  "{count}",
                  orphanFilesStatus.visitorOrphanCount.toString()
                )}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.visitorOrphanCount === 0
                ? LABELS.ORPHAN_FILES_NO_STORAGE_ORPHAN
                : LABELS.ORPHAN_FILES_STORAGE_ORPHAN_DESC}
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
                {LABELS.ORPHAN_FILES_DB_ORPHAN.replace(
                  "{count}",
                  orphanFilesStatus.visitorDbOrphanCount.toString()
                )}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.visitorDbOrphanCount === 0
                ? LABELS.ORPHAN_FILES_NO_DB_ORPHAN
                : LABELS.ORPHAN_FILES_DB_ORPHAN_DESC}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {LABELS.ORPHAN_FILES_PROFILE_IMAGES}
          </Label>
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
                {LABELS.ORPHAN_FILES_STORAGE_ORPHAN.replace(
                  "{count}",
                  orphanFilesStatus.profileOrphanCount.toString()
                )}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.profileOrphanCount === 0
                ? LABELS.ORPHAN_FILES_NO_STORAGE_ORPHAN
                : LABELS.ORPHAN_FILES_STORAGE_ORPHAN_PROFILE_DESC}
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
                {LABELS.ORPHAN_FILES_DB_ORPHAN.replace(
                  "{count}",
                  orphanFilesStatus.profileDbOrphanCount.toString()
                )}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {orphanFilesStatus.profileDbOrphanCount === 0
                ? LABELS.ORPHAN_FILES_NO_DB_ORPHAN
                : LABELS.ORPHAN_FILES_DB_ORPHAN_PROFILE_DESC}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
