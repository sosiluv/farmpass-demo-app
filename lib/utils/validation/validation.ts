/**
 * 폼 검증 유틸리티
 *
 * 여러 페이지에서 사용되는 공통 검증 로직을 모아둔 유틸리티입니다.
 */

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

  // 010, 011, 016, 017, 018, 019로 시작하는 경우만 포맷팅
  if (numbers.length >= 3 && /^01[0|1|6|7|8|9]/.test(numbers)) {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
        7,
        11
      )}`;
    } else {
      // 11자리 초과시 11자리로 자름
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
  }

  // 유효하지 않은 형식이면 원본 반환 (에러 메시지는 validation에서 처리)
  return phone;
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

  if (
    errorMessage.toLowerCase().includes("account is locked") ||
    errorMessage.toLowerCase().includes("account_locked")
  ) {
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
  if (
    errorMessage.toLowerCase().includes("invalid login credentials") ||
    errorMessage.toLowerCase().includes("login_failed")
  ) {
    return {
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
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

  // 라우터 커스텀 에러들 처리
  if (
    errorMessage.toLowerCase().includes("user not found") ||
    errorMessage.toLowerCase().includes("user_not_found")
  ) {
    return {
      message: "등록되지 않은 이메일 주소입니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("email rate limit exceeded")) {
    return {
      message: "이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("invalid email")) {
    return {
      message: "올바른 이메일 주소를 입력해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("error sending recovery email")) {
    return {
      message: "이메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }

  // 새로운 영어 에러 코드들 처리

  if (errorMessage.toLowerCase().includes("push_send_failed")) {
    return {
      message: "푸시 알림 발송에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("invalid_credentials")) {
    return {
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("image_upload_failed")) {
    return {
      message: "이미지 업로드에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("image_delete_failed")) {
    return {
      message: "이미지 삭제에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("key_copy_failed")) {
    return {
      message: "키 복사에 실패했습니다. 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("export_failed")) {
    return {
      message: "내보내기에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("csv 다운로드 중 오류가 발생했습니다")
  ) {
    return {
      message:
        "파일 다운로드 중 오류가 발생했습니다. 브라우저 설정을 확인해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("invalid_email_format")) {
    return {
      message: "올바른 이메일 형식을 입력해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("invalid_notification_type")) {
    return {
      message: "유효하지 않은 알림 유형입니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("broadcast_sending_failed")) {
    return {
      message: "브로드캐스트 알림 발송에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("log_cleanup_failed")) {
    return {
      message: "로그 정리 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("cleanup_status_query_failed")) {
    return {
      message: "정리 상태 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("orphan_files_check_failed")) {
    return {
      message: "Orphan 파일 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("orphan_files_cleanup_failed")) {
    return {
      message: "Orphan 파일 정리 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("invalid_retention_period")) {
    return {
      message: "유효하지 않은 보존 기간입니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("expired_count_query_failed")) {
    return {
      message: "만료된 방문자 데이터 개수 확인에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // 로그 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("log_delete_failed")) {
    return {
      message: "로그 삭제 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("unsupported delete operation")) {
    return {
      message: "지원하지 않는 삭제 작업입니다.",
      shouldRedirect: false,
    };
  }

  // Health/Monitoring 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("health_check_failed")) {
    return {
      message: "시스템 헬스체크에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("monitoring_data_fetch_failed")) {
    return {
      message: "모니터링 데이터 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // Notification Settings 관련 에러 코드들 처리
  if (
    errorMessage.toLowerCase().includes("notification_settings_read_failed")
  ) {
    return {
      message: "알림 설정 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage
      .toLowerCase()
      .includes("notification_settings_read_system_error")
  ) {
    return {
      message: "알림 설정 조회 중 시스템 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("notification_settings_update_failed")
  ) {
    return {
      message: "알림 설정 업데이트에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("notification_settings_create_failed")
  ) {
    return {
      message: "알림 설정 생성에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage
      .toLowerCase()
      .includes("notification_settings_update_system_error")
  ) {
    return {
      message: "알림 설정 업데이트 중 시스템 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }

  // Profile 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("profile_update_failed")) {
    return {
      message: "프로필 정보 저장에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("profile_image_upload_failed")) {
    return {
      message: "프로필 이미지 업로드에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // Push 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("invalid_subscription_data")) {
    return {
      message: "구독 정보가 올바르지 않습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscription_validation_failed")) {
    return {
      message: "구독 데이터가 유효하지 않습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscription_delete_failed")) {
    return {
      message: "기존 구독 삭제에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscription_save_failed")) {
    return {
      message: "구독 저장에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscription_fetch_failed")) {
    return {
      message: "구독 정보 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscription_get_system_error")) {
    return {
      message: "구독 조회 중 시스템 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("missing_endpoint")) {
    return {
      message: "엔드포인트가 필요합니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscription_unsubscribe_failed")) {
    return {
      message: "구독 해제에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("subscription_cleanup_fetch_failed")
  ) {
    return {
      message: "구독 정리 중 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("vapid_key_generation_failed")) {
    return {
      message: "VAPID 키 생성에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("vapid_key_fetch_failed")) {
    return {
      message: "VAPID 키 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("missing_required_fields")) {
    return {
      message: "필수 입력 항목이 누락되었습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("subscriber_fetch_failed")) {
    return {
      message: "구독자 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // Settings 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("system_settings_fetch_failed")) {
    return {
      message: "시스템 설정 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("system_settings_not_found")) {
    return {
      message: "시스템 설정을 찾을 수 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("system_settings_update_failed")) {
    return {
      message: "시스템 설정 업데이트에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("cache_clear_all_failed")) {
    return {
      message: "모든 캐시 초기화에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("cache_invalidate_failed")) {
    return {
      message: "캐시 무효화에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("cache_info_fetch_failed")) {
    return {
      message: "캐시 정보 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // User Info 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("user_info_fetch_failed")) {
    return {
      message: "사용자 정보 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // User Search 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("farm_not_found")) {
    return {
      message: "농장을 찾을 수 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("user_search_unauthorized")) {
    return {
      message: "사용자 검색 권한이 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("user_search_failed")) {
    return {
      message: "사용자 검색에 실패했습니다.",
      shouldRedirect: false,
    };
  }

  // Visitor 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("visitor_data_fetch_failed")) {
    return {
      message: "방문자 데이터 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("visitor_registration_failed") ||
    errorMessage.toLowerCase().includes("visitor_create_error")
  ) {
    return {
      message: "방문자 등록에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("visitor_registration_system_error")
  ) {
    return {
      message: "방문자 등록 중 시스템 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("visitor_fetch_error")) {
    return {
      message: "방문자 목록 조회에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("daily_limit_exceeded")) {
    return {
      message: "오늘 방문자 등록 한도를 초과했습니다.",
      shouldRedirect: false,
    };
  }

  // Auth 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("missing_credentials")) {
    return {
      message: "이메일과 비밀번호가 필요합니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("too many login attempts")) {
    // API 응답에서 timeLeft 정보 추출 시도
    const timeLeftMatch = errorMessage.match(/(\d+) minutes?/i);
    const timeLeft = timeLeftMatch ? parseInt(timeLeftMatch[1]) : null;

    if (timeLeft) {
      return {
        message: `너무 많은 로그인 시도가 있었습니다. ${timeLeft}분 후에 다시 시도해주세요.`,
        shouldRedirect: false,
      };
    } else {
      return {
        message:
          "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
        shouldRedirect: false,
      };
    }
  }
  if (errorMessage.toLowerCase().includes("login_system_error")) {
    return {
      message: "로그인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("missing_email")) {
    return {
      message: "이메일 주소를 입력해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("email_check_error")) {
    return {
      message: "이메일 확인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("user_profile_error")) {
    return {
      message: "사용자 정보 확인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("password_reset_system_error")) {
    return {
      message: "비밀번호 재설정 처리 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("reset_attempts_error")) {
    return {
      message: "로그인 시도 횟수 초기화 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("missing_turnstile_token")) {
    return {
      message: "캡차 토큰이 필요합니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("turnstile_verification_failed")) {
    return {
      message: "캡차 인증에 실패했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("turnstile_system_error")) {
    return {
      message: "캡차 인증 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }

  // 회원가입 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("failed to fetch")) {
    return {
      message: "회원가입 요청이 실패했습니다. 네트워크 상태를 확인해주세요.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("database error")) {
    return {
      message: "프로필 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }
  if (
    errorMessage.toLowerCase().includes("security purposes") ||
    errorMessage.toLowerCase().includes("429")
  ) {
    return {
      message: "보안을 위해 잠시 후에 다시 시도해주세요. (약 40초 후)",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("already registered")) {
    return {
      message: "이미 등록된 이메일입니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("registration failed")) {
    return {
      message: "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
      shouldRedirect: false,
    };
  }

  // Farm/Farm-members 관련 에러 코드들 처리
  if (errorMessage.toLowerCase().includes("missing_farm_ids")) {
    return {
      message: "농장 ID 목록이 필요합니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_access_check_error")) {
    return {
      message: "농장 접근 권한 확인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_member_access_check_error")) {
    return {
      message: "농장 구성원 접근 권한 확인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("unauthorized_farms")) {
    // 동적 unauthorizedFarms 정보 활용
    if (
      error &&
      typeof error === "object" &&
      "unauthorizedFarms" in error &&
      Array.isArray((error as any).unauthorizedFarms)
    ) {
      return {
        message: `일부 농장에 대한 접근 권한이 없습니다: ${(
          error as any
        ).unauthorizedFarms.join(", ")}`,
        shouldRedirect: false,
      };
    }
    return {
      message: "일부 농장에 대한 접근 권한이 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_members_fetch_error")) {
    return {
      message: "농장 구성원 목록 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_members_bulk_fetch_error")) {
    return {
      message: "농장 구성원 일괄 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_create_error")) {
    return {
      message: "농장 생성 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_list_fetch_error")) {
    return {
      message: "농장 목록 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_fetch_error")) {
    return {
      message: "농장 정보 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_update_error")) {
    return {
      message: "농장 정보 수정 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("farm_delete_error")) {
    return {
      message: "농장 삭제 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_fetch_error")) {
    return {
      message: "농장 멤버 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_create_error")) {
    return {
      message: "농장 멤버 추가 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_update_error")) {
    return {
      message: "농장 멤버 역할 변경 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_delete_error")) {
    return {
      message: "농장 멤버 제거 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_check_error")) {
    return {
      message: "농장 멤버 확인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_already_exists")) {
    return {
      message: "이미 농장의 구성원입니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("member_not_found")) {
    return {
      message: "농장 멤버를 찾을 수 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("cannot_change_owner_role")) {
    return {
      message: "농장 소유자의 역할은 변경할 수 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("cannot_remove_owner")) {
    return {
      message: "농장 소유자는 제거할 수 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("profile_fetch_error")) {
    return {
      message: "사용자 프로필 조회 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }

  if (errorMessage.toLowerCase().includes("permission_check_error")) {
    return {
      message: "권한 확인 중 오류가 발생했습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("insufficient_permissions")) {
    return {
      message: "이 작업을 수행할 권한이 없습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("access_denied")) {
    return {
      message: "접근이 거부되었습니다.",
      shouldRedirect: false,
    };
  }
  if (errorMessage.toLowerCase().includes("unauthorized")) {
    return {
      message: "인증되지 않은 접근입니다.",
      shouldRedirect: false,
    };
  }

  // 처리할 수 없는 에러는 라우터에서 받은 메시지를 그대로 사용
  return {
    message: errorMessage,
    shouldRedirect: false,
  };
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
