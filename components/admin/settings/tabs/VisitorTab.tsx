"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UserCheck } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import type { SystemSettings } from "@/lib/types/settings";
import { useNumberInput } from "@/hooks/use-number-input";
import SettingsCardHeader from "../SettingsCardHeader";

interface VisitorTabProps {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
}

export default function VisitorTab({
  settings,
  onUpdate,
  isLoading,
}: VisitorTabProps) {
  const reVisitAllowInterval = useNumberInput("reVisitAllowInterval");
  const maxVisitorsPerDay = useNumberInput("maxVisitorsPerDay");
  const visitorDataRetentionDays = useNumberInput("visitorDataRetentionDays");

  // 디스플레이용 상태
  const [reVisitAllowIntervalDisplay, setReVisitAllowIntervalDisplay] =
    useState(settings.reVisitAllowInterval.toString());
  const [maxVisitorsPerDayDisplay, setMaxVisitorsPerDayDisplay] = useState(
    settings.maxVisitorsPerDay.toString()
  );
  const [visitorDataRetentionDaysDisplay, setVisitorDataRetentionDaysDisplay] =
    useState(settings.visitorDataRetentionDays.toString());

  // settings가 변경될 때 디스플레이 값 업데이트
  useEffect(() => {
    if (!reVisitAllowInterval.isEditing) {
      setReVisitAllowIntervalDisplay(settings.reVisitAllowInterval.toString());
    }
  }, [settings.reVisitAllowInterval, reVisitAllowInterval.isEditing]);

  useEffect(() => {
    if (!maxVisitorsPerDay.isEditing) {
      setMaxVisitorsPerDayDisplay(settings.maxVisitorsPerDay.toString());
    }
  }, [settings.maxVisitorsPerDay, maxVisitorsPerDay.isEditing]);

  useEffect(() => {
    if (!visitorDataRetentionDays.isEditing) {
      setVisitorDataRetentionDaysDisplay(
        settings.visitorDataRetentionDays.toString()
      );
    }
  }, [settings.visitorDataRetentionDays, visitorDataRetentionDays.isEditing]);

  return (
    <ErrorBoundary
      title="방문자 설정 탭 오류"
      description="방문자 설정을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <Card>
        <SettingsCardHeader
          icon={UserCheck}
          title="방문자 정책"
          description="방문자 관련 정책을 설정합니다."
        />
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="reVisitAllowInterval">
              재방문 허용 간격 (시간)
            </Label>
            <Input
              id="reVisitAllowInterval"
              type="number"
              value={reVisitAllowIntervalDisplay}
              onChange={(e) =>
                reVisitAllowInterval.handleChange(
                  e,
                  (value) => onUpdate("reVisitAllowInterval", value),
                  setReVisitAllowIntervalDisplay
                )
              }
              onBlur={(e) =>
                reVisitAllowInterval.handleBlur(
                  e.target.value,
                  (value) => onUpdate("reVisitAllowInterval", value),
                  setReVisitAllowIntervalDisplay
                )
              }
              onFocus={reVisitAllowInterval.handleFocus}
              min={reVisitAllowInterval.min}
              max={reVisitAllowInterval.max}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxVisitorsPerDay">일일 최대 방문자 수</Label>
            <Input
              id="maxVisitorsPerDay"
              type="number"
              value={maxVisitorsPerDayDisplay}
              onChange={(e) =>
                maxVisitorsPerDay.handleChange(
                  e,
                  (value) => onUpdate("maxVisitorsPerDay", value),
                  setMaxVisitorsPerDayDisplay
                )
              }
              onBlur={(e) =>
                maxVisitorsPerDay.handleBlur(
                  e.target.value,
                  (value) => onUpdate("maxVisitorsPerDay", value),
                  setMaxVisitorsPerDayDisplay
                )
              }
              onFocus={maxVisitorsPerDay.handleFocus}
              min={maxVisitorsPerDay.min}
              max={maxVisitorsPerDay.max}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="visitorDataRetentionDays">
              방문자 데이터 보존 기간 (일)
            </Label>
            <Input
              id="visitorDataRetentionDays"
              type="number"
              value={visitorDataRetentionDaysDisplay}
              onChange={(e) =>
                visitorDataRetentionDays.handleChange(
                  e,
                  (value) => onUpdate("visitorDataRetentionDays", value),
                  setVisitorDataRetentionDaysDisplay
                )
              }
              onBlur={(e) =>
                visitorDataRetentionDays.handleBlur(
                  e.target.value,
                  (value) => onUpdate("visitorDataRetentionDays", value),
                  setVisitorDataRetentionDaysDisplay
                )
              }
              onFocus={visitorDataRetentionDays.handleFocus}
              min={visitorDataRetentionDays.min}
              max={visitorDataRetentionDays.max}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireVisitorPhoto">방문자 사진 필수</Label>
            <Switch
              id="requireVisitorPhoto"
              checked={settings.requireVisitorPhoto}
              onCheckedChange={(checked) =>
                onUpdate("requireVisitorPhoto", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireVisitorContact">연락처 필수</Label>
            <Switch
              id="requireVisitorContact"
              checked={settings.requireVisitorContact}
              onCheckedChange={(checked) =>
                onUpdate("requireVisitorContact", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireVisitPurpose">방문 목적 필수</Label>
            <Switch
              id="requireVisitPurpose"
              checked={settings.requireVisitPurpose}
              onCheckedChange={(checked) =>
                onUpdate("requireVisitPurpose", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
