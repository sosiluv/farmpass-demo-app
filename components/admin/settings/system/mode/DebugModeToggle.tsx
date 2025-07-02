import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertTriangle } from "lucide-react";

interface DebugModeToggleProps {
  debugMode: boolean;
  onUpdate: (value: boolean) => void;
  isLoading: boolean;
}

export function DebugModeToggle({
  debugMode,
  onUpdate,
  isLoading,
}: DebugModeToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Bug className="h-4 w-4" />
            디버그 모드
          </Label>
          {debugMode && (
            <Badge
              variant="outline"
              className="text-xs border-orange-300 text-orange-700"
            >
              활성화
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          개발 및 문제 해결을 위한 상세한 디버그 정보를 표시합니다
        </p>
        {debugMode && (
          <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>디버그 패널이 화면 우측 하단에 표시됩니다</span>
          </div>
        )}
      </div>
      <Switch
        checked={debugMode}
        onCheckedChange={onUpdate}
        disabled={isLoading}
      />
    </div>
  );
}
