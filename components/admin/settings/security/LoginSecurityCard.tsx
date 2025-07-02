"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import { useNumberInput } from "@/hooks/use-number-input";
import SettingsCardHeader from "../SettingsCardHeader";

type LoginSecuritySettings = Pick<
  SystemSettings,
  "maxLoginAttempts" | "accountLockoutDurationMinutes"
>;

interface LoginSecurityCardProps {
  settings: LoginSecuritySettings;
  onUpdate: (key: keyof LoginSecuritySettings, value: any) => void;
  isLoading?: boolean;
}

export default function LoginSecurityCard({
  settings,
  onUpdate,
  isLoading = false,
}: LoginSecurityCardProps) {
  const maxLoginAttempts = useNumberInput("maxLoginAttempts");
  const accountLockoutDuration = useNumberInput(
    "accountLockoutDurationMinutes"
  );

  // 디스플레이용 상태
  const [maxLoginAttemptsDisplay, setMaxLoginAttemptsDisplay] = useState(
    settings.maxLoginAttempts.toString()
  );
  const [accountLockoutDurationDisplay, setAccountLockoutDurationDisplay] =
    useState(settings.accountLockoutDurationMinutes.toString());

  // settings가 변경될 때 디스플레이 값 업데이트
  useEffect(() => {
    if (!maxLoginAttempts.isEditing) {
      setMaxLoginAttemptsDisplay(settings.maxLoginAttempts.toString());
    }
  }, [settings.maxLoginAttempts, maxLoginAttempts.isEditing]);

  useEffect(() => {
    if (!accountLockoutDuration.isEditing) {
      setAccountLockoutDurationDisplay(
        settings.accountLockoutDurationMinutes.toString()
      );
    }
  }, [
    settings.accountLockoutDurationMinutes,
    accountLockoutDuration.isEditing,
  ]);

  return (
    <Card>
      <SettingsCardHeader
        icon={UserCheck}
        title="로그인 보안"
        description="사용자 로그인 시도 및 계정 보안 설정을 관리합니다"
        iconClassName="h-5 w-5"
      />
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">최대 로그인 시도 횟수</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min={maxLoginAttempts.min}
              max={maxLoginAttempts.max}
              value={maxLoginAttemptsDisplay}
              onChange={(e) =>
                maxLoginAttempts.handleChange(
                  e,
                  (value) => onUpdate("maxLoginAttempts", value),
                  setMaxLoginAttemptsDisplay
                )
              }
              onBlur={(e) =>
                maxLoginAttempts.handleBlur(
                  e.target.value,
                  (value) => onUpdate("maxLoginAttempts", value),
                  setMaxLoginAttemptsDisplay
                )
              }
              onFocus={maxLoginAttempts.handleFocus}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              로그인 실패 시 계정을 일시적으로 잠그는 기준 횟수입니다 (3-10회)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountLockoutDurationMinutes">
              계정 잠금 시간 (분)
            </Label>
            <Input
              id="accountLockoutDurationMinutes"
              type="number"
              min={accountLockoutDuration.min}
              max={accountLockoutDuration.max}
              value={accountLockoutDurationDisplay}
              onChange={(e) =>
                accountLockoutDuration.handleChange(
                  e,
                  (value) => onUpdate("accountLockoutDurationMinutes", value),
                  setAccountLockoutDurationDisplay
                )
              }
              onBlur={(e) =>
                accountLockoutDuration.handleBlur(
                  e.target.value,
                  (value) => onUpdate("accountLockoutDurationMinutes", value),
                  setAccountLockoutDurationDisplay
                )
              }
              onFocus={accountLockoutDuration.handleFocus}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              로그인 시도 횟수 초과 시 계정이 잠기는 시간입니다 (5분-24시간)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
