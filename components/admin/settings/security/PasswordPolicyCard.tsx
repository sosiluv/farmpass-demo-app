"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import { LABELS, PLACEHOLDERS, PAGE_HEADER } from "@/lib/constants/settings";
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
        title={PAGE_HEADER.PASSWORD_POLICY_TITLE}
        description={PAGE_HEADER.PASSWORD_POLICY_DESCRIPTION}
      />
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="passwordMinLength">
              {PLACEHOLDERS.PASSWORD_MIN_LENGTH}
            </Label>
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
              {LABELS.PASSWORD_MIN_LENGTH_DESC}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="passwordRequireSpecialChar">
                {LABELS.PASSWORD_SPECIAL_CHAR}
              </Label>
              <p className="text-sm text-muted-foreground">
                {LABELS.PASSWORD_SPECIAL_CHAR_DESC}
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
              <Label htmlFor="passwordRequireNumber">
                {LABELS.PASSWORD_NUMBER}
              </Label>
              <p className="text-sm text-muted-foreground">
                {LABELS.PASSWORD_NUMBER_DESC}
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
              <Label htmlFor="passwordRequireUpperCase">
                {LABELS.PASSWORD_UPPERCASE}
              </Label>
              <p className="text-sm text-muted-foreground">
                {LABELS.PASSWORD_UPPERCASE_DESC}
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
              <Label htmlFor="passwordRequireLowerCase">
                {LABELS.PASSWORD_LOWERCASE}
              </Label>
              <p className="text-sm text-muted-foreground">
                {LABELS.PASSWORD_LOWERCASE_DESC}
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
