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
        title="표시 형식 설정"
        description="날짜 및 시간 표시 형식을 설정합니다"
      />
      <CardContent className="space-y-6">
        {/* 날짜 형식 */}
        <div className="space-y-2">
          <Label htmlFor="dateFormat">날짜 형식</Label>
          <Select
            value={settings.dateFormat}
            onValueChange={(value) => onSettingChange("dateFormat", value)}
            disabled={loading}
          >
            <SelectTrigger id="dateFormat">
              <SelectValue placeholder="날짜 형식 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YYYY-MM-DD">
                YYYY-MM-DD (2025-01-21)
              </SelectItem>
              <SelectItem value="DD/MM/YYYY">
                DD/MM/YYYY (21/01/2025)
              </SelectItem>
              <SelectItem value="MM/DD/YYYY">
                MM/DD/YYYY (01/21/2025)
              </SelectItem>
              <SelectItem value="YYYY년 MM월 DD일">
                YYYY년 MM월 DD일 (2025년 01월 21일)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            시스템 전체에서 사용할 날짜 표시 형식입니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
