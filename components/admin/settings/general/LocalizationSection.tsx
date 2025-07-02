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
        title="지역화 설정"
        description="언어, 시간대 및 지역별 설정을 관리합니다"
      />
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 언어 설정 */}
          <div className="space-y-2">
            <Label htmlFor="language">언어</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => onSettingChange("language", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="언어 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              시스템 전체에서 사용할 기본 언어입니다
            </p>
          </div>

          {/* 시간대 설정 */}
          <div className="space-y-2">
            <Label htmlFor="timezone">시간대</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => onSettingChange("timezone", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="시간대 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">Asia/Seoul (UTC+9)</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                <SelectItem value="Asia/Shanghai">
                  Asia/Shanghai (UTC+8)
                </SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              로그 및 방문 기록에 사용할 시간대입니다
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
