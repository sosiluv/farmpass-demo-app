/**
 * 폼 검증 유틸리티
 *
 * 여러 페이지에서 사용되는 공통 검증 로직을 모아둔 유틸리티입니다.
 */

import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import { z } from "zod";

/**
 * 전화번호 정규식 패턴
 * 010, 011, 016, 017, 018, 019로 시작하는 한국 휴대폰 번호 형식
 */
export const PHONE_PATTERN = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;

// 기본 비밀번호 규칙 (보수적인 설정)
export const DEFAULT_PASSWORD_RULES = {
  passwordMinLength: 6, // 일반적인 보안 기준
  passwordRequireSpecialChar: true, // 더 강력한 보안을 위해
  passwordRequireNumber: true, // 더 강력한 보안을 위해
  passwordRequireUpperCase: true, // 더 강력한 보안을 위해
  passwordRequireLowerCase: true, // 더 강력한 보안을 위해
} as const;

interface PasswordRules {
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUpperCase: boolean;
  passwordRequireLowerCase: boolean;
}

// 타입 내보내기
export type { PasswordRules };

/**
 * 비밀번호 규칙 추출 유틸리티 (시스템 설정에서)
 * React Hook에서 사용하기 위한 순수 함수
 */
export const extractPasswordRules = (settings: any): PasswordRules => {
  if (!settings) {
    return DEFAULT_PASSWORD_RULES;
  }

  return {
    passwordMinLength:
      settings.passwordMinLength || DEFAULT_PASSWORD_RULES.passwordMinLength,
    passwordRequireSpecialChar:
      settings.passwordRequireSpecialChar ??
      DEFAULT_PASSWORD_RULES.passwordRequireSpecialChar,
    passwordRequireNumber:
      settings.passwordRequireNumber ??
      DEFAULT_PASSWORD_RULES.passwordRequireNumber,
    passwordRequireUpperCase:
      settings.passwordRequireUpperCase ??
      DEFAULT_PASSWORD_RULES.passwordRequireUpperCase,
    passwordRequireLowerCase:
      settings.passwordRequireLowerCase ??
      DEFAULT_PASSWORD_RULES.passwordRequireLowerCase,
  };
};

/**
 * 이메일 형식 검증
 * @param email 검증할 이메일 주소
 * @returns 검증 결과
 */
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    message: isValid ? "" : "유효한 이메일 주소를 입력해주세요.",
  };
};

/**
 * 이메일 중복 검사
 * @param email 검증할 이메일 주소
 * @returns 검증 결과
 */
export const checkEmailDuplicate = async (email: string) => {
  try {
    const data = await apiClient(
      `/api/auth/check-email?email=${encodeURIComponent(email)}`,
      {
        context: "이메일 중복 검사",
        onError: (error, context) => {
          handleError(error, context);
        },
      }
    );

    return {
      isValid: !data.isDuplicate,
      message: data.message || "",
    };
  } catch (err) {
    // 에러는 이미 onError에서 처리됨
    return {
      isValid: false,
      message: "이메일 확인 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 한국 휴대폰 번호 검증
 * @param phone 검증할 전화번호
 * @returns 유효한 전화번호인지 여부
 */
export const validatePhone = (phone: string): boolean => {
  return PHONE_PATTERN.test(phone);
};

/**
 * 휴대폰 번호 형식 자동 변환
 * @param phone 입력된 전화번호
 * @returns 형식이 맞춰진 전화번호
 */
export const formatPhone = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, "");

  // 010으로 시작하는 11자리 숫자인 경우에만 변환
  if (numbers.length === 11 && numbers.startsWith("010")) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  return phone; // 변환할 수 없는 경우 원본 반환
};

/**
 * 전화번호 포맷팅 (visitor-utils.ts에서 이동)
 */
export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
};

/**
 * 이름 검증
 * @param name 검증할 이름
 * @param minLength 최소 길이 (기본값: 2)
 * @param maxLength 최대 길이 (기본값: 50)
 * @returns 검증 결과
 */
export const validateName = (
  name: string,
  minLength: number = 2,
  maxLength: number = 50
) => {
  const trimmedName = name.trim();

  if (trimmedName.length < minLength) {
    return {
      isValid: false,
      message: `이름은 최소 ${minLength}자 이상이어야 합니다.`,
    };
  }

  if (trimmedName.length > maxLength) {
    return {
      isValid: false,
      message: `이름은 최대 ${maxLength}자까지 가능합니다.`,
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * 차량번호 검증 (한국 차량번호 형식)
 * @param vehicleNumber 검증할 차량번호
 * @returns 검증 결과
 */
export const validateVehicleNumber = (vehicleNumber: string) => {
  if (!vehicleNumber || vehicleNumber.trim().length === 0) {
    return {
      isValid: true, // 차량번호는 선택사항
      message: "",
    };
  }

  // 한국 차량번호 패턴 (예: 12가1234, 123가1234)
  const vehicleRegex = /^\d{2,3}[가-힣]\d{4}$/;

  if (!vehicleRegex.test(vehicleNumber.trim())) {
    return {
      isValid: false,
      message: "올바른 차량번호 형식을 입력해주세요. (예: 12가1234)",
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * 회원가입 에러 메시지 생성
 * @param error 발생한 에러
 * @returns 사용자 친화적인 에러 메시지
 */
export const getRegistrationErrorMessage = (error: any): string => {
  if (error.message === "Failed to fetch") {
    return "회원가입 요청이 실패했습니다. 네트워크 상태를 확인해주세요.";
  }

  if (error.message.includes("Database error")) {
    return "프로필 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (error.message.includes("security purposes") || error.status === 429) {
    return "보안을 위해 잠시 후에 다시 시도해주세요. (약 40초 후)";
  }

  if (error.message.includes("already registered")) {
    return "이미 등록된 이메일입니다.";
  }

  return "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.";
};

// =================================
// 인증 에러 처리 (auth-error.ts 통합)
// =================================

import { AuthError } from "@supabase/supabase-js";

interface AuthErrorResponse {
  message: string;
  shouldRedirect?: boolean;
  redirectTo?: string;
}

export function getAuthErrorMessage(
  error: AuthError | Error | unknown
): AuthErrorResponse {
  const errorMessage =
    error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

  // 기본 응답 객체
  const defaultResponse: AuthErrorResponse = {
    message: "처리 중 오류가 발생했습니다. 다시 시도해주세요.",
    shouldRedirect: false,
  };

  if (!errorMessage) return defaultResponse;

  if (errorMessage.toLowerCase().includes("account is locked")) {
    return {
      message:
        "계정이 잠겼습니다. 관리자에게 문의하거나 잠시 후 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("too many requests")) {
    return {
      message: "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage
      .toLowerCase()
      .includes("new password should be different from the old password")
  ) {
    return {
      message: "이전 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("session")) {
    return {
      message: "세션이 만료되었습니다. 다시 시도해주세요.",
      shouldRedirect: true,
      redirectTo: "/reset-password",
    };
  }
  if (errorMessage.toLowerCase().includes("password should be")) {
    return {
      message:
        "비밀번호는 최소 6자 이상이어야 하며, 영문, 숫자, 특수문자를 포함해야 합니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("invalid login credentials")) {
    return {
      message: "인증에 실패했습니다. 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("token has expired") ||
    errorMessage.toLowerCase().includes("invalid reset password token") ||
    errorMessage.toLowerCase().includes("password reset token has expired") ||
    errorMessage
      .toLowerCase()
      .includes("email link is invalid or has expired") ||
    errorMessage.toLowerCase().includes("invalid password reset token") ||
    errorMessage.toLowerCase().includes("invalid token")
  ) {
    return {
      message:
        "비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 새로운 링크를 요청해주세요.",
      shouldRedirect: true,
      redirectTo: "/reset-password",
    };
  }
  if (errorMessage.toLowerCase().includes("token has already been used")) {
    return {
      message:
        "이미 사용된 비밀번호 재설정 링크입니다. 새로운 링크를 요청해주세요.",
      shouldRedirect: true,
      redirectTo: "/reset-password",
    };
  }
  if (errorMessage.toLowerCase().includes("email not confirmed")) {
    return {
      message: "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("auth")) {
    return {
      message: "인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  return defaultResponse;
}

/**
 * 비밀번호 변경 폼 스키마 생성 (시스템 설정 기반)
 */
export const createChangePasswordFormSchema = (rules: PasswordRules) => {
  // 기본 비밀번호 유효성 검사 스키마
  let passwordSchema = z.string().min(rules.passwordMinLength, {
    message: `비밀번호는 최소 ${rules.passwordMinLength}자 이상이어야 합니다.`,
  });

  // 특수문자 요구사항
  if (rules.passwordRequireSpecialChar) {
    passwordSchema = passwordSchema.regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      {
        message: "비밀번호는 특수문자를 포함해야 합니다.",
      }
    );
  }

  // 숫자 요구사항
  if (rules.passwordRequireNumber) {
    passwordSchema = passwordSchema.regex(/\d/, {
      message: "비밀번호는 숫자를 포함해야 합니다.",
    });
  }

  // 대문자 요구사항
  if (rules.passwordRequireUpperCase) {
    passwordSchema = passwordSchema.regex(/[A-Z]/, {
      message: "비밀번호는 대문자를 포함해야 합니다.",
    });
  }

  // 소문자 요구사항
  if (rules.passwordRequireLowerCase) {
    passwordSchema = passwordSchema.regex(/[a-z]/, {
      message: "비밀번호는 소문자를 포함해야 합니다.",
    });
  }

  return z
    .object({
      currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
      path: ["confirmPassword"],
    });
};

/**
 * 기본 비밀번호 변경 폼 스키마 (설정을 불러올 수 없을 때 사용)
 */
export const createDefaultChangePasswordFormSchema = () => {
  return createChangePasswordFormSchema(DEFAULT_PASSWORD_RULES);
};
