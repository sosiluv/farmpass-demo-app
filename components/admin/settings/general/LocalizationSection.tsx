import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import {
  LABELS,
  PLACEHOLDERS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  PAGE_HEADER,
} from "@/lib/constants/settings";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";

interface LocalizationSectionProps {
  settings: SystemSettings;
  onSettingChange: (key: keyof SystemSettings, value: any) => void;
  loading?: boolean;
}

export function LocalizationSection({
  settings,
  onSettingChange,
  loading,
}: LocalizationSectionProps) {
  return (
    <Card>
      <SettingsCardHeader
        icon={Globe}
        title={PAGE_HEADER.LOCALIZATION_TITLE}
        description={PAGE_HEADER.LOCALIZATION_DESCRIPTION}
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 언어 설정 */}
          <div className="space-y-2">
            <Label
              htmlFor="language"
              className="text-sm sm:text-base font-medium"
            >
              {LABELS.LANGUAGE}
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value) => onSettingChange("language", value)}
              disabled={loading}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder={PLACEHOLDERS.LANGUAGE_SELECT} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm sm:text-base text-muted-foreground">
              {LABELS.LANGUAGE_DESCRIPTION}
            </p>
          </div>

          {/* 시간대 설정 */}
          <div className="space-y-2">
            <Label
              htmlFor="timezone"
              className="text-sm sm:text-base font-medium"
            >
              {LABELS.TIMEZONE}
            </Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => onSettingChange("timezone", value)}
              disabled={loading}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder={PLACEHOLDERS.TIMEZONE_SELECT} />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm sm:text-base text-muted-foreground">
              {LABELS.TIMEZONE_DESCRIPTION}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
