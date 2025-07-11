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
  if (!lastCleanupSuccess) return null;

  return (
    <Alert>
      <FileX className="h-4 w-4" />
      <AlertDescription>{lastCleanupSuccess} 정리 완료</AlertDescription>
    </Alert>
  );
}
