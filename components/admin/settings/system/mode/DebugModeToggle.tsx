import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertTriangle } from "lucide-react";
import { LABELS } from "@/lib/constants/settings";

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
          <Label
            htmlFor="debug-mode"
            className="text-sm sm:text-base font-medium flex items-center gap-1"
          >
            <Bug className="h-4 w-4" />
            {LABELS.DEBUG_MODE}
          </Label>
          {debugMode && (
            <Badge
              variant="outline"
              className="text-sm sm:text-base border-orange-300 text-orange-700"
            >
              {LABELS.DEBUG_MODE_ACTIVE}
            </Badge>
          )}
        </div>
        {debugMode && (
          <div className="flex items-center gap-1 text-sm sm:text-base text-orange-600 mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{LABELS.DEBUG_MODE_PANEL_WARNING}</span>
          </div>
        )}
      </div>
      <Switch
        id="debug-mode"
        checked={debugMode}
        onCheckedChange={onUpdate}
        disabled={isLoading}
      />
    </div>
  );
}
