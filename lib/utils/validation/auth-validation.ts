import * as z from "zod";
import {
  validateEmail,
  validateName,
  validatePhone,
  DEFAULT_PASSWORD_RULES,
} from "./validation";

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
    return `비밀번호는 최소 ${
      rules.passwordMinLength
    }자 이상이어야 하며, ${requirements.join(", ")}를 포함해야 합니다.`;
  }

  return `비밀번호는 최소 ${rules.passwordMinLength}자 이상이어야 합니다.`;
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
      currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
    }),
    [options.passwordFieldName || "password"]: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .min(
        passwordRules.passwordMinLength,
        `비밀번호는 최소 ${passwordRules.passwordMinLength}자 이상이어야 합니다`
      )
      .refine(
        (password) => validatePasswordComplexity(password, passwordRules),
        {
          message: getPasswordErrorMessage(passwordRules),
        }
      ),
    confirmPassword: z.string().min(1, "비밀번호를 입력해주세요"),
  };

  return z.object(baseSchema).refine(
    (data) => {
      const password = data[options.passwordFieldName || "password"];
      return password === data.confirmPassword;
    },
    {
      message: "비밀번호가 일치하지 않습니다",
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
        .min(1, "이메일을 입력해주세요")
        .refine((email) => validateEmail(email).isValid, {
          message: "유효한 이메일 주소를 입력해주세요",
        }),
      name: z
        .string()
        .min(1, "이름을 입력해주세요")
        .refine((name) => validateName(name).isValid, {
          message: "이름은 2자 이상 50자 이하여야 합니다",
        }),
      password: z
        .string()
        .min(1, "비밀번호를 입력해주세요")
        .min(
          passwordRules.passwordMinLength,
          `비밀번호는 최소 ${passwordRules.passwordMinLength}자 이상이어야 합니다`
        )
        .refine(
          (password) => validatePasswordComplexity(password, passwordRules),
          {
            message: getPasswordErrorMessage(passwordRules),
          }
        ),
      confirmPassword: z.string().min(1, "비밀번호를 입력해주세요"),
      phone: z
        .string()
        .min(1, "전화번호를 입력해주세요")
        .refine((phone) => validatePhone(phone), {
          message: "올바른 전화번호 형식(010-XXXX-XXXX)을 입력해주세요",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "비밀번호가 일치하지 않습니다",
      path: ["confirmPassword"],
    });

/**
 * 로그인 폼 스키마
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
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
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
    newPassword: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
    confirmPassword: z.string().min(1, "비밀번호를 입력해주세요"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

/**
 * 비밀번호 재설정 요청 폼 스키마
 */
export const resetPasswordRequestFormSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("유효한 이메일 주소를 입력해주세요"),
});

/**
 * 기본 스키마 생성 함수들 (스키마 로드 실패 시 사용)
 */
export const createDefaultRegistrationFormSchema = () =>
  createRegistrationFormSchema(DEFAULT_PASSWORD_RULES);

export const createDefaultResetPasswordFormSchema = () =>
  createResetPasswordFormSchema(DEFAULT_PASSWORD_RULES);

export const createDefaultChangePasswordFormSchema = () =>
  createChangePasswordFormSchema(DEFAULT_PASSWORD_RULES);

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
