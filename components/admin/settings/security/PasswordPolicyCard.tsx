"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import { useNumberInput } from "@/hooks/use-number-input";
import SettingsCardHeader from "../SettingsCardHeader";

type PasswordPolicySettings = Pick<
  SystemSettings,
  | "passwordMinLength"
  | "passwordRequireSpecialChar"
  | "passwordRequireNumber"
  | "passwordRequireUpperCase"
  | "passwordRequireLowerCase"
>;

interface PasswordPolicyCardProps {
  settings: PasswordPolicySettings;
  onUpdate: (key: keyof PasswordPolicySettings, value: any) => void;
  isLoading?: boolean;
}

export default function PasswordPolicyCard({
  settings,
  onUpdate,
  isLoading = false,
}: PasswordPolicyCardProps) {
  const passwordMinLength = useNumberInput("passwordMinLength");

  // 디스플레이용 상태
  const [passwordMinLengthDisplay, setPasswordMinLengthDisplay] = useState(
    settings.passwordMinLength.toString()
  );

  // settings가 변경될 때 디스플레이 값 업데이트
  useEffect(() => {
    if (!passwordMinLength.isEditing) {
      setPasswordMinLengthDisplay(settings.passwordMinLength.toString());
    }
  }, [settings.passwordMinLength, passwordMinLength.isEditing]);

  return (
    <Card>
      <SettingsCardHeader
        icon={Lock}
        title="비밀번호 정책"
        description="사용자 계정의 비밀번호 보안 규칙을 설정합니다"
      />
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="passwordMinLength">최소 비밀번호 길이</Label>
            <Input
              id="passwordMinLength"
              type="number"
              min={passwordMinLength.min}
              max={passwordMinLength.max}
              value={passwordMinLengthDisplay}
              onChange={(e) =>
                passwordMinLength.handleChange(
                  e,
                  (value) => onUpdate("passwordMinLength", value),
                  setPasswordMinLengthDisplay
                )
              }
              onBlur={(e) =>
                passwordMinLength.handleBlur(
                  e.target.value,
                  (value) => onUpdate("passwordMinLength", value),
                  setPasswordMinLengthDisplay
                )
              }
              onFocus={passwordMinLength.handleFocus}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              사용자가 설정해야 하는 최소 비밀번호 길이입니다 (8-20자)
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireSpecialChar">특수문자 포함</Label>
              <p className="text-sm text-muted-foreground">
                !@#$%^&* 등의 특수문자를 반드시 포함하도록 합니다
              </p>
            </div>
            <Switch
              id="passwordRequireSpecialChar"
              checked={settings.passwordRequireSpecialChar}
              onCheckedChange={(checked) =>
                onUpdate("passwordRequireSpecialChar", checked)
              }
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireNumber">숫자 포함</Label>
              <p className="text-sm text-muted-foreground">
                0-9 숫자를 반드시 포함하도록 합니다
              </p>
            </div>
            <Switch
              id="passwordRequireNumber"
              checked={settings.passwordRequireNumber}
              onCheckedChange={(checked) =>
                onUpdate("passwordRequireNumber", checked)
              }
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireUpperCase">대문자 포함</Label>
              <p className="text-sm text-muted-foreground">
                A-Z 대문자를 반드시 포함하도록 합니다
              </p>
            </div>
            <Switch
              id="passwordRequireUpperCase"
              checked={settings.passwordRequireUpperCase}
              onCheckedChange={(checked) =>
                onUpdate("passwordRequireUpperCase", checked)
              }
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireLowerCase">소문자 포함</Label>
              <p className="text-sm text-muted-foreground">
                a-z 소문자를 반드시 포함하도록 합니다
              </p>
            </div>
            <Switch
              id="passwordRequireLowerCase"
              checked={settings.passwordRequireLowerCase}
              onCheckedChange={(checked) =>
                onUpdate("passwordRequireLowerCase", checked)
              }
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
