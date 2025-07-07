import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import type { SystemSettings } from "@/lib/types/settings";
import { INPUT_VALIDATION_RULES } from "@/lib/constants/defaults";

interface SettingsValidatorProps {
  user: any;
}

export function useSettingsValidator({ user }: SettingsValidatorProps) {
  const { showWarning } = useCommonToast();

  // 입력 필드 유효성 검사 설정 - 공통 상수에서 가져옴
  const inputValidations = {
    maxLoginAttempts: {
      ...INPUT_VALIDATION_RULES.maxLoginAttempts,
      name: "최대 로그인 시도 횟수",
    },
    accountLockoutDurationMinutes: {
      ...INPUT_VALIDATION_RULES.accountLockoutDurationMinutes,
      name: "계정 잠금 시간",
    },
    passwordMinLength: {
      ...INPUT_VALIDATION_RULES.passwordMinLength,
      name: "비밀번호 최소 길이",
    },
    reVisitAllowInterval: {
      ...INPUT_VALIDATION_RULES.reVisitAllowInterval,
      name: "재방문 허용 간격",
    },
    maxVisitorsPerDay: {
      ...INPUT_VALIDATION_RULES.maxVisitorsPerDay,
      name: "일일 최대 방문자 수",
    },
    visitorDataRetentionDays: {
      ...INPUT_VALIDATION_RULES.visitorDataRetentionDays,
      name: "방문자 데이터 보존 기간",
    },
    logRetentionDays: {
      ...INPUT_VALIDATION_RULES.logRetentionDays,
      name: "로그 보관 기간",
    },
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
        showWarning(
          "입력 범위 오류",
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
