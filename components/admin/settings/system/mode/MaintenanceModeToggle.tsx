import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wrench, AlertTriangle } from "lucide-react";

interface MaintenanceModeToggleProps {
  maintenanceMode: boolean;
  onUpdate: (value: boolean) => void;
  isLoading: boolean;
}

export function MaintenanceModeToggle({
  maintenanceMode,
  onUpdate,
  isLoading,
}: MaintenanceModeToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="maintenance-mode"
            className="text-sm font-medium flex items-center gap-1"
          >
            <Wrench className="h-4 w-4" />
            유지보수 모드
          </Label>
          {maintenanceMode && (
            <Badge variant="destructive" className="text-xs">
              활성화
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          시스템 업데이트 시 일반 사용자의 접근을 제한합니다
        </p>
        {maintenanceMode && (
          <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>일반 사용자는 현재 시스템에 접근할 수 없습니다</span>
          </div>
        )}
      </div>
      <Switch
        id="maintenance-mode"
        checked={maintenanceMode}
        onCheckedChange={onUpdate}
        disabled={isLoading}
      />
    </div>
  );
}
