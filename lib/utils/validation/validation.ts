/**
 * 폼 검증 유틸리티
 *
 * 여러 페이지에서 사용되는 공통 검증 로직을 모아둔 유틸리티입니다.
 */

import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { PHONE_PATTERN } from "@/lib/constants/input-rules";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";

// 기본 비밀번호 규칙 (보수적인 설정)
const DEFAULT_PASSWORD_RULES = {
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

/**
 * 비밀번호 규칙 가져오기
 */
const getPasswordRules = async () => {
  try {
    const settings = await getSystemSettings();
    return {
      passwordMinLength: settings.passwordMinLength,
      passwordRequireSpecialChar: settings.passwordRequireSpecialChar,
      passwordRequireNumber: settings.passwordRequireNumber,
      passwordRequireUpperCase: settings.passwordRequireUpperCase,
      passwordRequireLowerCase: settings.passwordRequireLowerCase,
    };
  } catch (error) {
    devLog.error("Failed to fetch password rules:", error);

    return DEFAULT_PASSWORD_RULES;
  }
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
 * 비밀번호 복잡성 검증
 * @param password 검증할 비밀번호
 * @returns 검증 결과 객체
 */
export const validatePassword = async (password: string) => {
  try {
    const rules = await getPasswordRules();
    const {
      passwordMinLength,
      passwordRequireSpecialChar,
      passwordRequireNumber,
      passwordRequireUpperCase,
      passwordRequireLowerCase,
    } = rules;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const checks = {
      minLength: password.length >= passwordMinLength,
      hasUpperCase: !passwordRequireUpperCase || hasUpperCase,
      hasLowerCase: !passwordRequireLowerCase || hasLowerCase,
      hasNumbers: !passwordRequireNumber || hasNumbers,
      hasSpecialChar: !passwordRequireSpecialChar || hasSpecialChar,
    };

    const isValid = Object.values(checks).every(Boolean);

    return {
      isValid,
      checks,
      message: isValid
        ? ""
        : getPasswordErrorMessage(checks, passwordMinLength, rules),
      rules,
    };
  } catch (error) {
    // 예상치 못한 에러 발생 시 기본값으로 검증
    devLog.error("Unexpected error during password validation:", error);
    const rules = DEFAULT_PASSWORD_RULES;

    const checks = {
      minLength: password.length >= rules.passwordMinLength,
      hasUpperCase: !rules.passwordRequireUpperCase || /[A-Z]/.test(password),
      hasLowerCase: !rules.passwordRequireLowerCase || /[a-z]/.test(password),
      hasNumbers: !rules.passwordRequireNumber || /\d/.test(password),
      hasSpecialChar:
        !rules.passwordRequireSpecialChar ||
        /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const isValid = Object.values(checks).every(Boolean);

    return {
      isValid,
      checks,
      message: isValid
        ? ""
        : getPasswordErrorMessage(checks, rules.passwordMinLength, rules),
      rules,
    };
  }
};

/**
 * 비밀번호 오류 메시지 생성
 */
const getPasswordErrorMessage = (
  checks: Record<string, boolean>,
  minLength: number,
  rules: PasswordRules
): string => {
  if (!checks.minLength) {
    return `비밀번호는 최소 ${minLength}자 이상이어야 합니다.`;
  }

  const requirements: string[] = [];

  if (rules.passwordRequireUpperCase && !checks.hasUpperCase) {
    requirements.push("대문자");
  }
  if (rules.passwordRequireLowerCase && !checks.hasLowerCase) {
    requirements.push("소문자");
  }
  if (rules.passwordRequireNumber && !checks.hasNumbers) {
    requirements.push("숫자");
  }
  if (rules.passwordRequireSpecialChar && !checks.hasSpecialChar) {
    requirements.push("특수문자");
  }

  if (requirements.length > 0) {
    return `비밀번호는 ${requirements.join(", ")}를 포함해야 합니다.`;
  }

  return "";
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
 * 주소 검증
 * @param address 검증할 주소
 * @param minLength 최소 길이 (기본값: 5)
 * @param maxLength 최대 길이 (기본값: 200)
 * @returns 검증 결과
 */
export const validateAddress = (
  address: string,
  minLength: number = 5,
  maxLength: number = 200
) => {
  const trimmedAddress = address.trim();

  if (trimmedAddress.length < minLength) {
    return {
      isValid: false,
      message: "주소를 입력해주세요.",
    };
  }

  if (trimmedAddress.length > maxLength) {
    return {
      isValid: false,
      message: "주소가 너무 깁니다.",
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * 비밀번호 확인 검증
 * @param password 원본 비밀번호
 * @param confirmPassword 확인 비밀번호
 * @returns 검증 결과
 */
export const validatePasswordConfirm = (
  password: string,
  confirmPassword: string
) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: "비밀번호가 일치하지 않습니다.",
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * 필수 필드 검증
 * @param value 검증할 값
 * @param fieldName 필드명
 * @returns 검증 결과
 */
export const validateRequired = (value: string, fieldName: string) => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      message: `${fieldName}을(를) 입력해주세요.`,
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
 * 날짜 범위 검증
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 검증 결과
 */
export const validateDateRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) {
    return {
      isValid: false,
      message: "시작 날짜와 종료 날짜를 모두 선택해주세요.",
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      isValid: false,
      message: "시작 날짜는 종료 날짜보다 이전이어야 합니다.",
    };
  }

  // 최대 5년 범위 제한
  const maxYears = 5;
  const maxDays = maxYears * 365;
  const diffDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays > maxDays) {
    return {
      isValid: false,
      message: `날짜 범위는 최대 ${maxYears}년까지 선택 가능합니다.`,
    };
  }

  return {
    isValid: true,
    message: "",
  };
};

/**
 * 폼 전체 검증 헬퍼
 * @param validations 검증 함수들의 배열
 * @returns 전체 검증 결과
 */
export const validateForm = (
  validations: Array<
    () => { isValid: boolean; message: string; field?: string }
  >
) => {
  const errors: Record<string, string> = {};
  let isValid = true;

  validations.forEach((validation) => {
    const result = validation();
    if (!result.isValid) {
      isValid = false;
      if (result.field) {
        errors[result.field] = result.message;
      }
    }
  });

  return {
    isValid,
    errors,
  };
};

/**
 * 회원가입 폼 전체 검증
 * @param formData 검증할 폼 데이터
 * @returns 검증 결과
 */
export const validateRegistrationForm = async (formData: {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  phone: string;
}) => {
  const errors: Record<string, string> = {};

  // 이메일 검증
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  // 이름 검증
  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  // 비밀번호 검증
  const passwordValidation = await validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  // 비밀번호 확인 검증
  const confirmValidation = validatePasswordConfirm(
    formData.password,
    formData.confirmPassword
  );
  if (!confirmValidation.isValid) {
    errors.confirmPassword = confirmValidation.message;
  }

  // 전화번호 검증
  if (!validatePhone(formData.phone)) {
    errors.phone = "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
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

  // 에러 메시지가 없는 경우 기본 응답 반환
  if (!errorMessage) return defaultResponse;

  // 로그인 관련 에러들 (로그인 페이지에서 사용 중인 메시지들)
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

  // 비밀번호 관련 에러
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

  // 세션 관련 에러
  if (errorMessage.toLowerCase().includes("session")) {
    return {
      message: "세션이 만료되었습니다. 다시 시도해주세요.",
      shouldRedirect: true,
      redirectTo: "/reset-password",
    };
  }

  // 비밀번호 규칙 관련 에러
  if (errorMessage.toLowerCase().includes("password should be")) {
    return {
      message:
        "비밀번호는 최소 8자 이상이어야 하며, 영문, 숫자, 특수문자를 포함해야 합니다.",
      shouldRedirect: false,
    };
  }

  // 인증 실패 에러
  if (errorMessage.toLowerCase().includes("invalid login credentials")) {
    return {
      message: "인증에 실패했습니다. 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }

  // 토큰 관련 에러 (대소문자 구분 없이 처리)
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

  // 토큰 사용됨 에러
  if (errorMessage.toLowerCase().includes("token has already been used")) {
    return {
      message:
        "이미 사용된 비밀번호 재설정 링크입니다. 새로운 링크를 요청해주세요.",
      shouldRedirect: true,
      redirectTo: "/reset-password",
    };
  }

  // 이메일 인증 관련 에러
  if (errorMessage.toLowerCase().includes("email not confirmed")) {
    return {
      message: "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
      shouldRedirect: false,
    };
  }

  // 기타 인증 관련 에러
  if (errorMessage.toLowerCase().includes("auth")) {
    return {
      message: "인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }

  return defaultResponse;
}
