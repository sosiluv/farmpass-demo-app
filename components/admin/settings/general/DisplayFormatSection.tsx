import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import {
  LABELS,
  PLACEHOLDERS,
  DATE_FORMAT_OPTIONS,
  PAGE_HEADER,
} from "@/lib/constants/settings";
import type { SystemSettings } from "@/lib/types/settings";
import SettingsCardHeader from "../SettingsCardHeader";

interface DisplayFormatSectionProps {
  settings: SystemSettings;
  onSettingChange: (key: keyof SystemSettings, value: any) => void;
  loading?: boolean;
}

export function DisplayFormatSection({
  settings,
  onSettingChange,
  loading,
}: DisplayFormatSectionProps) {
  return (
    <Card>
      <SettingsCardHeader
        icon={Calendar}
        title={PAGE_HEADER.DISPLAY_FORMAT_TITLE}
        description={PAGE_HEADER.DISPLAY_FORMAT_DESCRIPTION}
      />
      <CardContent className="space-y-6">
        {/* 날짜 형식 */}
        <div className="space-y-2">
          <Label
            htmlFor="dateFormat"
            className="text-sm sm:text-base font-medium"
          >
            {LABELS.DATE_FORMAT}
          </Label>
          <Select
            value={settings.dateFormat}
            onValueChange={(value) => onSettingChange("dateFormat", value)}
            disabled={loading}
          >
            <SelectTrigger id="dateFormat">
              <SelectValue placeholder={PLACEHOLDERS.DATE_FORMAT_SELECT} />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm sm:text-base text-muted-foreground">
            {LABELS.DATE_FORMAT_DESCRIPTION}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
