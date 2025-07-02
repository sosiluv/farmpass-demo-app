import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BroadcastResultProps {
  lastSendResult: {
    success: boolean;
    sentCount: number;
    failureCount: number;
    timestamp: Date;
  } | null;
}

export function BroadcastResult({ lastSendResult }: BroadcastResultProps) {
  if (!lastSendResult) return null;

  return (
    <Alert
      className={cn(
        lastSendResult.success
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      )}
    >
      {lastSendResult.success ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-600" />
      )}
      <AlertDescription>
        <div className="flex items-center gap-2">
          <span>{lastSendResult.success ? "발송 완료" : "발송 실패"}</span>
          <Badge variant="outline">
            {lastSendResult.timestamp.toLocaleString()}
          </Badge>
        </div>
        {lastSendResult.success && (
          <div className="mt-1 text-sm">
            성공: {lastSendResult.sentCount}명
            {lastSendResult.failureCount > 0 && (
              <span className="text-yellow-600">
                , 실패: {lastSendResult.failureCount}명
              </span>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
