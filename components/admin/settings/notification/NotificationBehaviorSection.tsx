import React, { useMemo } from "react";
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

// 토글 설정 정의
const TOGGLE_CONFIGS = [
  {
    id: "push-sound",
    key: "pushSoundEnabled" as const,
    label: "소리 알림",
    description: "알림 수신 시 소리를 재생합니다",
  },
  {
    id: "push-vibrate",
    key: "pushVibrateEnabled" as const,
    label: "진동 알림",
    description: "모바일 기기에서 진동을 발생시킵니다",
  },
  {
    id: "push-require-interaction",
    key: "pushRequireInteraction" as const,
    label: "지속적 표시",
    description: "사용자가 확인할 때까지 알림을 유지합니다",
  },
] as const;

const NotificationBehaviorSection = React.memo(
  function NotificationBehaviorSection({
    settings,
    onUpdate,
  }: NotificationBehaviorSectionProps) {
    // 토글 상태 메모이제이션
    const toggleStates = useMemo(() => {
      return TOGGLE_CONFIGS.reduce((acc, config) => {
        acc[config.key] = Boolean(settings[config.key] || false);
        return acc;
      }, {} as Record<string, boolean>);
    }, [settings]);

    return (
      <Card>
        <SettingsCardHeader
          icon={Settings}
          title="알림 동작 설정"
          description="푸시 알림의 동작 방식을 설정합니다."
        />
        <CardContent className="space-y-4">
          {TOGGLE_CONFIGS.map((config) => (
            <div key={config.id} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={config.id} className="text-sm font-medium">
                  {config.label}
                </Label>
                <p className="text-xs text-muted-foreground">
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
