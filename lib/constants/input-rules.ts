import type { SystemSettings } from "@/lib/types/settings";

interface InputRule {
  min: number;
  max: number;
  defaultValue: number;
}

type NumberInputKeys =
  | "passwordMinLength"
  | "maxLoginAttempts"
  | "accountLockoutDurationMinutes"
  | "reVisitAllowInterval"
  | "maxVisitorsPerDay"
  | "visitorDataRetentionDays"
  | "logRetentionDays"
  | "apiRateLimit";

type NumberInputRules = {
  [K in NumberInputKeys]: InputRule;
};

export const NUMBER_INPUT_RULES: NumberInputRules = {
  // 보안 설정
  passwordMinLength: {
    min: 6,
    max: 32,
    defaultValue: 8,
  },
  maxLoginAttempts: {
    min: 3,
    max: 10,
    defaultValue: 5,
  },
  accountLockoutDurationMinutes: {
    min: 5,
    max: 1440,
    defaultValue: 15,
  },

  // 방문자 정책
  reVisitAllowInterval: {
    min: 0,
    max: 168,
    defaultValue: 6,
  },
  maxVisitorsPerDay: {
    min: 1,
    max: 1000,
    defaultValue: 100,
  },
  visitorDataRetentionDays: {
    min: 30,
    max: 3650,
    defaultValue: 1095,
  },

  // 시스템 설정
  logRetentionDays: {
    min: 7,
    max: 365,
    defaultValue: 90,
  },
  apiRateLimit: {
    min: 10,
    max: 1000,
    defaultValue: 100,
  },
};

/**
 * 전화번호 정규식 패턴
 * 010, 011, 016, 017, 018, 019로 시작하는 한국 휴대폰 번호 형식
 */
export const PHONE_PATTERN = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
