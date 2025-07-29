import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { LABELS } from "@/lib/constants/settings";

export function BroadcastAlert() {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-2 text-sm sm:text-base">
        <p>
          <strong>{LABELS.BROADCAST_ALERT_WARNING}</strong>{" "}
          {LABELS.BROADCAST_ALERT_DESCRIPTION}
        </p>
        <ul className="text-sm sm:text-base list-disc list-inside space-y-1">
          <li>
            <strong>{LABELS.BROADCAST_ALERT_NOTICE}</strong>{" "}
            {LABELS.BROADCAST_ALERT_NOTICE_DESC}
          </li>
          <li>
            <strong>{LABELS.BROADCAST_ALERT_EMERGENCY}</strong>{" "}
            {LABELS.BROADCAST_ALERT_EMERGENCY_DESC}
          </li>
          <li>
            <strong>{LABELS.BROADCAST_ALERT_MAINTENANCE}</strong>{" "}
            {LABELS.BROADCAST_ALERT_MAINTENANCE_DESC}
          </li>
        </ul>
        <p className="text-sm sm:text-base mt-2">
          {LABELS.BROADCAST_ALERT_SPAM_WARNING}
        </p>
      </AlertDescription>
    </Alert>
  );
}
