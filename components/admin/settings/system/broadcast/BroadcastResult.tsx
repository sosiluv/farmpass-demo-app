import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/constants/settings";

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
      <AlertDescription className="text-sm sm:text-base">
        <div className="flex items-center gap-2">
          {lastSendResult.success ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              {LABELS.BROADCAST_RESULT_SUCCESS}
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-red-600" />
              {LABELS.BROADCAST_RESULT_FAILURE}
            </>
          )}
          <Badge variant="outline" className="text-sm sm:text-base">
            {lastSendResult.timestamp.toLocaleString()}
          </Badge>
        </div>
        {lastSendResult.success && (
          <div className="mt-1 text-sm sm:text-base">
            {LABELS.BROADCAST_RESULT_SUCCESS_COUNT.replace(
              "{count}",
              lastSendResult.sentCount.toString()
            )}
            {lastSendResult.failureCount > 0 && (
              <span className="text-yellow-600">
                ,{" "}
                {LABELS.BROADCAST_RESULT_FAILURE_COUNT.replace(
                  "{count}",
                  lastSendResult.failureCount.toString()
                )}
              </span>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
