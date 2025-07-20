import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Clock, Phone } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/settings";
import { formatDateTime } from "@/lib/utils/datetime/date";
import type { SystemSettings } from "@/lib/types/settings";

interface MaintenanceSettingsProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

export function MaintenanceSettings({
  settings,
  onUpdate,
  isLoading,
}: MaintenanceSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="maintenance-message"
          className="text-sm font-medium flex items-center gap-1"
        >
          <MessageSquare className="h-4 w-4" />
          {LABELS.MAINTENANCE_MESSAGE}
        </Label>
        <Textarea
          id="maintenance-message"
          value={settings.maintenanceMessage}
          onChange={(e) => onUpdate("maintenanceMessage", e.target.value)}
          placeholder={PLACEHOLDERS.MAINTENANCE_MESSAGE}
          className="min-h-[80px]"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="maintenance-time"
          className="text-sm font-medium flex items-center gap-1"
        >
          <Clock className="h-4 w-4" />
          {LABELS.MAINTENANCE_ESTIMATED_TIME}
        </Label>
        <Input
          id="maintenance-time"
          type="number"
          min="1"
          max="10080" // 1주일
          value={settings.maintenanceEstimatedTime}
          onChange={(e) =>
            onUpdate("maintenanceEstimatedTime", parseInt(e.target.value) || 30)
          }
          placeholder={PLACEHOLDERS.MAINTENANCE_ESTIMATED_TIME}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          {LABELS.MAINTENANCE_CURRENT_SETTING}{" "}
          {settings.maintenanceEstimatedTime < 60
            ? `${settings.maintenanceEstimatedTime}분`
            : settings.maintenanceEstimatedTime < 1440
            ? `${Math.floor(settings.maintenanceEstimatedTime / 60)}시간 ${
                settings.maintenanceEstimatedTime % 60
              }분`
            : `${Math.floor(
                settings.maintenanceEstimatedTime / 1440
              )}일 ${Math.floor(
                (settings.maintenanceEstimatedTime % 1440) / 60
              )}시간`}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          <Phone className="h-4 w-4" />
          {LABELS.MAINTENANCE_CONTACT_INFO}
        </Label>
        <Textarea
          value={settings.maintenanceContactInfo}
          onChange={(e) => onUpdate("maintenanceContactInfo", e.target.value)}
          placeholder={PLACEHOLDERS.MAINTENANCE_CONTACT_INFO}
          className="min-h-[60px]"
          disabled={isLoading}
        />
      </div>
      {settings.maintenanceStartTime && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {LABELS.MAINTENANCE_START_TIME}
          </Label>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(settings.maintenanceStartTime)}
          </p>
        </div>
      )}
    </div>
  );
}
