import * as z from "zod";
import { validateEmail, validateName, validatePhone } from "./validation";
import { ERROR_MESSAGES } from "@/lib/constants/auth";
import { SECURITY_DEFAULTS } from "@/lib/constants/defaults";

// Zod용 비밀번호 복잡성 검증 함수
const validatePasswordComplexity = (password: string, rules: any) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const checks = {
    minLength: password.length >= rules.passwordMinLength,
    hasUpperCase: !rules.passwordRequireUpperCase || hasUpperCase,
    hasLowerCase: !rules.passwordRequireLowerCase || hasLowerCase,
    hasNumbers: !rules.passwordRequireNumber || hasNumbers,
    hasSpecialChar: !rules.passwordRequireSpecialChar || hasSpecialChar,
  };

  return Object.values(checks).every(Boolean);
};

/**
 * 비밀번호 오류 메시지 생성 (Zod용)
 */
const getPasswordErrorMessage = (rules: any): string => {
  const requirements: string[] = [];

  if (rules.passwordRequireUpperCase) {
    requirements.push("대문자");
  }
  if (rules.passwordRequireLowerCase) {
    requirements.push("소문자");
  }
  if (rules.passwordRequireNumber) {
    requirements.push("숫자");
  }
  if (rules.passwordRequireSpecialChar) {
    requirements.push("특수문자");
  }

  if (requirements.length > 0) {
    return ERROR_MESSAGES.PASSWORD_COMPLEXITY.replace(
      "{minLength}",
      rules.passwordMinLength.toString()
    ).replace("{requirements}", requirements.join(", "));
  }

  return ERROR_MESSAGES.PASSWORD_MIN_LENGTH.replace(
    "{minLength}",
    rules.passwordMinLength.toString()
  );
};

/**
 * 공통 비밀번호 검증 스키마 생성 함수
 */
const createPasswordValidationSchema = (
  passwordRules: any,
  options: {
    includeCurrentPassword?: boolean;
    passwordFieldName?: string;
  }
) => {
  const baseSchema: any = {
    ...(options.includeCurrentPassword && {
      currentPassword: z
        .string()
        .min(1, ERROR_MESSAGES.REQUIRED_CURRENT_PASSWORD),
    }),
    [options.passwordFieldName || "password"]: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_PASSWORD)
      .min(
        passwordRules.passwordMinLength,
        ERROR_MESSAGES.PASSWORD_MIN_LENGTH.replace(
          "{minLength}",
          passwordRules.passwordMinLength.toString()
        )
      )
      .refine(
        (password) => validatePasswordComplexity(password, passwordRules),
        {
          message: getPasswordErrorMessage(passwordRules),
        }
      ),
    confirmPassword: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_CONFIRM_PASSWORD),
  };

  return z.object(baseSchema).refine(
    (data) => {
      const password = data[options.passwordFieldName || "password"];
      return password === data.confirmPassword;
    },
    {
      message: ERROR_MESSAGES.PASSWORD_MISMATCH,
      path: ["confirmPassword"],
    }
  );
};

/**
 * 회원가입 폼 스키마 (동적)
 */
export const createRegistrationFormSchema = (passwordRules: any) =>
  z
    .object({
      email: z
        .string()
        .min(1, ERROR_MESSAGES.REQUIRED_EMAIL)
        .refine((email) => validateEmail(email).isValid, {
          message: ERROR_MESSAGES.INVALID_EMAIL,
        }),
      name: z
        .string()
        .min(1, ERROR_MESSAGES.REQUIRED_NAME)
        .refine((name) => validateName(name).isValid, {
          message: ERROR_MESSAGES.INVALID_NAME,
        }),
      password: z
        .string()
        .min(1, ERROR_MESSAGES.REQUIRED_PASSWORD)
        .min(
          passwordRules.passwordMinLength,
          ERROR_MESSAGES.PASSWORD_MIN_LENGTH.replace(
            "{minLength}",
            passwordRules.passwordMinLength.toString()
          )
        )
        .refine(
          (password) => validatePasswordComplexity(password, passwordRules),
          {
            message: getPasswordErrorMessage(passwordRules),
          }
        ),
      confirmPassword: z
        .string()
        .min(1, ERROR_MESSAGES.REQUIRED_CONFIRM_PASSWORD),
      phone: z
        .string()
        .min(1, ERROR_MESSAGES.REQUIRED_PHONE)
        .refine((phone) => validatePhone(phone), {
          message: ERROR_MESSAGES.INVALID_PHONE,
        }),
      // 약관 동의는 bottom sheet 모달에서 처리하므로 폼 스키마에서 제거
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: ERROR_MESSAGES.PASSWORD_MISMATCH,
      path: ["confirmPassword"],
    });

/**
 * 로그인 폼 스키마
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_EMAIL)
    .email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z.string().min(1, ERROR_MESSAGES.REQUIRED_PASSWORD),
});

/**
 * 비밀번호 재설정 폼 스키마 (동적)
 */
export const createResetPasswordFormSchema = (passwordRules: any) =>
  createPasswordValidationSchema(passwordRules, {
    passwordFieldName: "password",
  });

/**
 * 비밀번호 변경 폼 스키마 (동적)
 */
export const createChangePasswordFormSchema = (passwordRules: any) =>
  createPasswordValidationSchema(passwordRules, {
    includeCurrentPassword: true,
    passwordFieldName: "newPassword",
  });

/**
 * 비밀번호 변경 폼 스키마 (기본)
 */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_CURRENT_PASSWORD),
    newPassword: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_PASSWORD)
      .min(6, ERROR_MESSAGES.PASSWORD_MIN_LENGTH.replace("{minLength}", "6")),
    confirmPassword: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED_CONFIRM_PASSWORD),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: ERROR_MESSAGES.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

/**
 * 비밀번호 재설정 요청 폼 스키마
 */
export const resetPasswordRequestFormSchema = z.object({
  email: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_EMAIL)
    .email(ERROR_MESSAGES.INVALID_EMAIL),
});

/**
 * 기본 스키마 생성 함수들 (스키마 로드 실패 시 사용)
 */
export const createDefaultRegistrationFormSchema = () =>
  createRegistrationFormSchema(SECURITY_DEFAULTS);

export const createDefaultResetPasswordFormSchema = () =>
  createResetPasswordFormSchema(SECURITY_DEFAULTS);

export const createDefaultChangePasswordFormSchema = () =>
  createChangePasswordFormSchema(SECURITY_DEFAULTS);

// 타입 정의
export type RegistrationFormData = z.infer<
  ReturnType<typeof createRegistrationFormSchema>
>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type ResetPasswordFormData = z.infer<
  ReturnType<typeof createResetPasswordFormSchema>
>;
export type ChangePasswordFormData = z.infer<
  ReturnType<typeof createChangePasswordFormSchema>
>;
export type ResetPasswordRequestFormData = z.infer<
  typeof resetPasswordRequestFormSchema
>;
