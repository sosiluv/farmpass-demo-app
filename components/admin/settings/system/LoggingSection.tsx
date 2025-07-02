import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";
import { LoggingLevelSelect, LoggingRetentionSelect } from "./logging";

interface LoggingSectionProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

export function LoggingSection({
  settings,
  onUpdate,
  isLoading,
}: LoggingSectionProps) {
  return (
    <Card>
      <SettingsCardHeader
        icon={FileText}
        title="로깅 설정"
        description="시스템 로그 수준과 보관 기간을 설정합니다"
      />
      <CardContent className="space-y-6">
        <LoggingLevelSelect
          value={settings.logLevel}
          onChange={(value) => onUpdate("logLevel", value)}
          isLoading={isLoading}
        />
        <LoggingRetentionSelect
          value={settings.logRetentionDays}
          onChange={(value) => onUpdate("logRetentionDays", value)}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
