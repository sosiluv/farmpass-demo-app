import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Clock, Phone } from "lucide-react";
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
          유지보수 메시지
        </Label>
        <Textarea
          id="maintenance-message"
          value={settings.maintenanceMessage}
          onChange={(e) => onUpdate("maintenanceMessage", e.target.value)}
          placeholder="유지보수 중 사용자에게 표시할 메시지를 입력하세요"
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
          예상 완료 시간 (분)
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
          placeholder="30"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          현재 설정:{" "}
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
          연락처 정보
        </Label>
        <Textarea
          value={settings.maintenanceContactInfo}
          onChange={(e) => onUpdate("maintenanceContactInfo", e.target.value)}
          placeholder="문의사항이 있으시면 관리자에게 연락해 주세요."
          className="min-h-[60px]"
          disabled={isLoading}
        />
      </div>
      {settings.maintenanceStartTime && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">유지보수 시작 시간</Label>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(settings.maintenanceStartTime)}
          </p>
        </div>
      )}
    </div>
  );
}
