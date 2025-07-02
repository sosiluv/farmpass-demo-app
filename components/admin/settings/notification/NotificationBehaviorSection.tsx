import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
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
    return (
      <Card>
        <SettingsCardHeader
          icon={Settings}
          title="알림 동작 설정"
          description="푸시 알림의 동작 방식을 설정합니다."
        />
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">소리 알림</Label>
              <p className="text-xs text-muted-foreground">
                알림 수신 시 소리를 재생합니다
              </p>
            </div>
            <Switch
              checked={settings.pushSoundEnabled || false}
              onCheckedChange={(checked) =>
                onUpdate("pushSoundEnabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">진동 알림</Label>
              <p className="text-xs text-muted-foreground">
                모바일 기기에서 진동을 발생시킵니다
              </p>
            </div>
            <Switch
              checked={settings.pushVibrateEnabled || false}
              onCheckedChange={(checked) =>
                onUpdate("pushVibrateEnabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">지속적 표시</Label>
              <p className="text-xs text-muted-foreground">
                사용자가 확인할 때까지 알림을 유지합니다
              </p>
            </div>
            <Switch
              checked={settings.pushRequireInteraction || false}
              onCheckedChange={(checked) =>
                onUpdate("pushRequireInteraction", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }
);

export default NotificationBehaviorSection;
