"use client";

import { useMemo } from "react";
import { Progress } from "./progress";
import { useSystemSettingsContext } from "@/components/providers/system-settings-provider";
import type { SystemSettings } from "@/lib/types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { LABELS } from "@/lib/constants/common";

interface PasswordRules {
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUpperCase: boolean;
  passwordRequireLowerCase: boolean;
}

// 기본 비밀번호 규칙 (보수적인 설정)
const DEFAULT_PASSWORD_RULES: PasswordRules = {
  passwordMinLength: 6,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUpperCase: true,
  passwordRequireLowerCase: true,
};

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  // 전역 시스템 설정 사용
  const { settings, isLoading, error } = useSystemSettingsContext();
  // 시스템 설정에서 비밀번호 규칙 추출
  const rules: PasswordRules = useMemo(() => {
    if (!settings) {
      devLog.warn(
        "System settings not available, using default password rules"
      );
      return DEFAULT_PASSWORD_RULES;
    }

    return {
      passwordMinLength: settings.passwordMinLength,
      passwordRequireSpecialChar: settings.passwordRequireSpecialChar,
      passwordRequireNumber: settings.passwordRequireNumber,
      passwordRequireUpperCase: settings.passwordRequireUpperCase,
      passwordRequireLowerCase: settings.passwordRequireLowerCase,
    };
  }, [settings]);

  // 에러 처리
  if (error) {
    devLog.error("Failed to fetch password rules:", error);
    devLog.warn("Using default password rules as fallback");
  } // 컴포넌트 마운트 시에만 실행

  const requirements = [
    {
      id: "length",
      label: LABELS.PASSWORD_STRENGTH_LENGTH_LABEL.replace(
        "{minLength}",
        rules.passwordMinLength.toString()
      ),
      shortLabel: LABELS.PASSWORD_STRENGTH_LENGTH_SHORT.replace(
        "{minLength}",
        rules.passwordMinLength.toString()
      ),
      validator: (pass: string) => pass.length >= rules.passwordMinLength,
    },
    {
      id: "number",
      label: LABELS.PASSWORD_STRENGTH_NUMBER_LABEL,
      shortLabel: LABELS.PASSWORD_STRENGTH_NUMBER_SHORT,
      validator: (pass: string) =>
        !rules.passwordRequireNumber || /\d/.test(pass),
      optional: !rules.passwordRequireNumber,
    },
    {
      id: "uppercase",
      label: LABELS.PASSWORD_STRENGTH_UPPERCASE_LABEL,
      shortLabel: LABELS.PASSWORD_STRENGTH_UPPERCASE_SHORT,
      validator: (pass: string) =>
        !rules.passwordRequireUpperCase || /[A-Z]/.test(pass),
      optional: !rules.passwordRequireUpperCase,
    },
    {
      id: "lowercase",
      label: LABELS.PASSWORD_STRENGTH_LOWERCASE_LABEL,
      shortLabel: LABELS.PASSWORD_STRENGTH_LOWERCASE_SHORT,
      validator: (pass: string) =>
        !rules.passwordRequireLowerCase || /[a-z]/.test(pass),
      optional: !rules.passwordRequireLowerCase,
    },
    {
      id: "special",
      label: LABELS.PASSWORD_STRENGTH_SPECIAL_LABEL,
      shortLabel: LABELS.PASSWORD_STRENGTH_SPECIAL_SHORT,
      validator: (pass: string) =>
        !rules.passwordRequireSpecialChar ||
        /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      optional: !rules.passwordRequireSpecialChar,
    },
  ];

  const getStrengthPercentage = () => {
    if (!password) return 0;
    const validRequirements = requirements.filter((req) =>
      req.validator(password)
    ).length;
    return (validRequirements / requirements.length) * 100;
  };

  const getStrengthColor = () => {
    const strength = getStrengthPercentage();
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthTextColor = () => {
    const strength = getStrengthPercentage();
    if (strength <= 20) return "text-red-600";
    if (strength <= 40) return "text-orange-600";
    if (strength <= 60) return "text-yellow-600";
    if (strength <= 80) return "text-blue-600";
    return "text-green-600";
  };

  const getStrengthText = () => {
    const strength = getStrengthPercentage();
    if (strength <= 20) return LABELS.PASSWORD_STRENGTH_VERY_WEAK;
    if (strength <= 40) return LABELS.PASSWORD_STRENGTH_WEAK;
    if (strength <= 60) return LABELS.PASSWORD_STRENGTH_NORMAL;
    if (strength <= 80) return LABELS.PASSWORD_STRENGTH_STRONG;
    return LABELS.PASSWORD_STRENGTH_VERY_STRONG;
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-6 bg-gray-200 rounded"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm flex-col gap-1 sm:flex-row sm:items-center">
        <div
          className="flex flex-wrap gap-1 min-w-0 max-w-full overflow-x-auto"
          style={{ rowGap: 4, columnGap: 4 }}
        >
          {requirements.map((req) => (
            <span
              key={req.id}
              className={`inline-flex items-center rounded px-2 py-1 text-xs whitespace-nowrap ${
                req.validator(password)
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
              style={{ minWidth: 40 }}
            >
              {req.shortLabel}
              {req.optional && LABELS.PASSWORD_STRENGTH_OPTIONAL}
            </span>
          ))}
        </div>
        <span
          className={`text-sm font-medium ${getStrengthTextColor()} mt-1 sm:mt-0`}
        >
          {getStrengthText()}
        </span>
      </div>
      <Progress
        value={getStrengthPercentage()}
        className={getStrengthColor()}
      />
    </div>
  );
}
