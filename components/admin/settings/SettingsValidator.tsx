import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { logSystemWarning } from "@/lib/utils/logging/system-log";
import type { SystemSettings } from "@/lib/types/settings";

interface SettingsValidatorProps {
  user: any;
}

export function useSettingsValidator({ user }: SettingsValidatorProps) {
  const { showCustomError } = useCommonToast();

  // 입력 필드 유효성 검사 설정
  const inputValidations = {
    maxLoginAttempts: { min: 3, max: 10, name: "최대 로그인 시도 횟수" },
    accountLockoutDurationMinutes: {
      min: 5,
      max: 1440,
      name: "계정 잠금 시간",
    },
    passwordMinLength: { min: 6, max: 32, name: "비밀번호 최소 길이" },
    reVisitAllowInterval: { min: 0, max: 168, name: "재방문 허용 간격" },
    maxVisitorsPerDay: { min: 1, max: 1000, name: "일일 최대 방문자 수" },
    visitorDataRetentionDays: {
      min: 30,
      max: 3650,
      name: "방문자 데이터 보존 기간",
    },
    logRetentionDays: { min: 7, max: 365, name: "로그 보관 기간" },
  } as const;

  const validateSetting = async <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ): Promise<boolean> => {
    // 유효성 검사
    if (key in inputValidations) {
      const validation = inputValidations[key as keyof typeof inputValidations];
      const numValue =
        typeof value === "number" ? value : parseInt(value as string);

      if (
        !isNaN(numValue) &&
        (numValue < validation.min || numValue > validation.max)
      ) {
        // 설정 유효성 검사 실패 로그 (문서에 명시된 WARN 레벨)
        await logSystemWarning(
          "settings_validation_failed",
          `설정 유효성 검사 실패: ${key} = ${value} (허용 범위: ${validation.min}-${validation.max})`,
          { userId: user?.id },
          {
            setting_key: key,
            attempted_value: value,
            validation_rule: validation,
          }
        );

        showCustomError(
          "설정 유효성 검사 실패",
          `${validation.name}는 ${validation.min}에서 ${validation.max} 사이의 값이어야 합니다.`
        );
        return false;
      }
    }

    return true;
  };

  return {
    validateSetting,
    inputValidations,
  };
}
