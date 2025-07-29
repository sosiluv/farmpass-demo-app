import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import {
  NOTIFICATION_BEHAVIOR_TOGGLES,
  PAGE_HEADER,
} from "@/lib/constants/settings";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";

interface NotificationBehaviorSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
}

const NotificationBehaviorSection = React.memo(
  function NotificationBehaviorSection({
    settings,
    onUpdate,
  }: NotificationBehaviorSectionProps) {
    // 토글 상태 메모이제이션
    const toggleStates = useMemo(() => {
      return NOTIFICATION_BEHAVIOR_TOGGLES.reduce((acc, config) => {
        acc[config.key] = Boolean(settings[config.key] || false);
        return acc;
      }, {} as Record<string, boolean>);
    }, [settings]);

    return (
      <Card>
        <SettingsCardHeader
          icon={Settings}
          title={PAGE_HEADER.NOTIFICATION_BEHAVIOR_TITLE}
          description={PAGE_HEADER.NOTIFICATION_BEHAVIOR_DESCRIPTION}
        />
        <CardContent className="space-y-4">
          {NOTIFICATION_BEHAVIOR_TOGGLES.map((config) => (
            <div key={config.id} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor={config.id}
                  className="text-sm sm:text-base font-medium"
                >
                  {config.label}
                </Label>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {config.description}
                </p>
              </div>
              <Switch
                id={config.id}
                checked={toggleStates[config.key]}
                onCheckedChange={(checked) => onUpdate(config.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
);

export default NotificationBehaviorSection;
