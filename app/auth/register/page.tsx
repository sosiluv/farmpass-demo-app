"use client";

import type React from "react";
import { useState, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, User, Lock, Phone, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { formatPhone } from "@/lib/utils/validation/validation";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { usePasswordRules } from "@/lib/utils/validation/usePasswordRules";
import { apiClient } from "@/lib/utils/data/api-client";
import {
  checkEmailDuplicate,
  getAuthErrorMessage,
} from "@/lib/utils/validation";
import { useAuthActions } from "@/hooks/useAuthActions";
import {
  createRegistrationFormSchema,
  createDefaultRegistrationFormSchema,
  type RegistrationFormData,
} from "@/lib/utils/validation/auth-validation";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Logo, Turnstile } from "@/components/common";
import { Loading } from "@/components/ui/loading";
import {
  BUTTONS,
  LABELS,
  PLACEHOLDERS,
  PAGE_HEADER,
} from "@/lib/constants/auth";

// 메모이제이션된 Turnstile 섹션 컴포넌트
const TurnstileSection = memo(
  ({
    onVerify,
    onError,
    onExpire,
    error,
  }: {
    onVerify: (token: string) => void;
    onError: (error: string) => void;
    onExpire: () => void;
    error: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm text-gray-800">
        {LABELS.CAPTCHA_LABEL} <span className="text-red-500">*</span>
      </label>
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
        onVerify={onVerify}
        onError={onError}
        onExpire={onExpire}
        theme="light"
        size="normal"
        className="flex justify-center"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);

TurnstileSection.displayName = "TurnstileSection";

// 메모이제이션된 이메일 필드 컴포넌트
const EmailField = memo(
  ({
    field,
    onBlur,
    error,
    isCheckingEmail,
    loading,
  }: {
    field: any;
    onBlur: () => void;
    error: string;
    isCheckingEmail: boolean;
    loading: boolean;
  }) => (
    <FormItem>
      <FormLabel className="text-sm text-gray-800">
        {LABELS.EMAIL} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="email"
            placeholder={PLACEHOLDERS.EMAIL}
            onBlur={(e) => {
              field.onBlur();
              onBlur();
            }}
            autoComplete="username"
            className={`h-12 pl-10 input-focus ${
              error ? "border-red-500" : ""
            }`}
            disabled={loading || isCheckingEmail}
          />
        </FormControl>
        {isCheckingEmail && (
          <Loading
            spinnerSize={16}
            showText={false}
            minHeight="auto"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </FormItem>
  )
);

EmailField.displayName = "EmailField";

// 메모이제이션된 이름 필드 컴포넌트
const NameField = memo(
  ({ field, loading }: { field: any; loading: boolean }) => (
    <FormItem>
      <FormLabel className="text-sm text-gray-800">
        {LABELS.NAME} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="text"
            placeholder={PLACEHOLDERS.NAME}
            autoComplete="name"
            className="h-12 pl-10 input-focus"
            disabled={loading}
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  )
);

NameField.displayName = "NameField";

// 메모이제이션된 비밀번호 필드 컴포넌트
const PasswordField = memo(
  ({ field, loading }: { field: any; loading: boolean }) => (
    <FormItem>
      <FormLabel className="text-sm text-gray-800">
        {LABELS.PASSWORD} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="password"
            placeholder={PLACEHOLDERS.PASSWORD}
            autoComplete="new-password"
            className="h-12 pl-10 input-focus"
            disabled={loading}
          />
        </FormControl>
      </div>
      <FormMessage />
      <PasswordStrength password={field.value} />
    </FormItem>
  )
);

PasswordField.displayName = "PasswordField";

// 메모이제이션된 비밀번호 확인 필드 컴포넌트
const ConfirmPasswordField = memo(
  ({ field, loading }: { field: any; loading: boolean }) => (
    <FormItem>
      <FormLabel className="text-sm text-gray-800">
        {LABELS.CONFIRM_PASSWORD} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="password"
            placeholder={PLACEHOLDERS.CONFIRM_PASSWORD}
            autoComplete="new-password"
            className="h-12 pl-10 input-focus"
            disabled={loading}
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  )
);

ConfirmPasswordField.displayName = "ConfirmPasswordField";

// 메모이제이션된 휴대폰 필드 컴포넌트
const PhoneField = memo(
  ({ field, loading }: { field: any; loading: boolean }) => (
    <FormItem>
      <FormLabel className="text-sm text-gray-800">
        {LABELS.PHONE} <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="tel"
            placeholder={PLACEHOLDERS.PHONE}
            className="h-12 pl-10 input-focus"
            disabled={loading}
            onChange={(e) => {
              const formattedPhone = formatPhone(e.target.value);
              field.onChange(formattedPhone);
            }}
            maxLength={13}
          />
        </FormControl>
      </div>
      <FormMessage />
    </FormItem>
  )
);

PhoneField.displayName = "PhoneField";

// 메모이제이션된 회원가입 버튼 컴포넌트
const RegisterButton = memo(
  ({ loading, disabled }: { loading: boolean; disabled: boolean }) => (
    <Button
      type="submit"
      className="h-12 w-full flex items-center justify-center"
      disabled={disabled}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {BUTTONS.REGISTER_LOADING}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          {BUTTONS.REGISTER_BUTTON}
        </>
      )}
    </Button>
  )
);

RegisterButton.displayName = "RegisterButton";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<string>("");
  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();
  const { signOut } = useAuthActions();

  // 시스템 설정에서 비밀번호 규칙 가져오기 (React Query 기반)
  const { rules: passwordRules, isLoading: isPasswordRulesLoading } =
    usePasswordRules();

  // 동적 스키마 생성 - React Query 기반으로 최적화
  const schema = useMemo(() => {
    if (isPasswordRulesLoading) return null;

    try {
      return createRegistrationFormSchema(passwordRules);
    } catch (error) {
      devLog.error("Failed to create registration schema:", error);
      return createDefaultRegistrationFormSchema();
    }
  }, [passwordRules, isPasswordRulesLoading]);

  // 메모이제이션된 폼 설정
  const formConfig = useMemo(
    () => ({
      resolver: schema
        ? zodResolver(schema)
        : zodResolver(createDefaultRegistrationFormSchema()),
      defaultValues: {
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
        phone: "",
      },
    }),
    [schema]
  );

  const form = useForm<RegistrationFormData>(formConfig);

  // 메모이제이션된 이메일 블러 핸들러
  const handleEmailBlur = useCallback(async () => {
    const email = form.getValues("email").trim();
    if (!email) return;

    // 이메일 중복 검사
    setIsCheckingEmail(true);
    try {
      const duplicateCheck = await checkEmailDuplicate(email);
      if (!duplicateCheck.isValid) {
        setEmailError(duplicateCheck.message);
      } else {
        setEmailError("");
      }
    } catch (error) {
      devLog.error("Email check error:", error);
      setEmailError("이메일 확인 중 오류가 발생했습니다.");
    } finally {
      setIsCheckingEmail(false);
    }
  }, [form]);

  // 메모이제이션된 Turnstile 핸들러들
  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError("");
  }, []);

  const handleTurnstileError = useCallback((error: string) => {
    setTurnstileError(error);
    setTurnstileToken("");
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
    setTurnstileError("캡차 인증이 만료되었습니다. 다시 시도해주세요.");
  }, []);

  // 메모이제이션된 회원가입 핸들러
  const handleRegister = useCallback(
    async (data: RegistrationFormData) => {
      showInfo("회원가입 시도 중", "잠시만 기다려주세요.");

      // 캡차 인증 확인
      if (!turnstileToken) {
        setTurnstileError("캡차 인증을 완료해주세요.");
        return;
      }

      setLoading(true);

      try {
        // 새로운 회원가입 API 호출
        const response = await apiClient("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone,
            turnstileToken: turnstileToken,
          }),
          context: "회원가입",
        });

        if (response.success) {
          // 회원가입 성공 후 로그아웃 처리
          await signOut();
          // 서버에서 반환된 메시지 그대로 사용
          showSuccess(
            "회원가입 완료",
            response.message || "회원가입이 완료되었습니다."
          );
          router.push("/auth/login");
        } else {
          throw new Error(response.message || "회원가입에 실패했습니다.");
        }
      } catch (error: any) {
        devLog.error("Registration failed:", error);
        const authError = getAuthErrorMessage(error);
        setEmailError(authError.message);

        showError("회원가입 실패", authError.message);
      } finally {
        setLoading(false);
      }
    },
    [turnstileToken, showInfo, showSuccess, showError, router, signOut]
  );

  // 메모이제이션된 버튼 비활성화 상태
  const isButtonDisabled = useMemo(() => {
    return loading || !!emailError || !turnstileToken;
  }, [loading, emailError, turnstileToken]);

  // 스키마 로딩 중이면 스켈레톤 표시
  if (isPasswordRulesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-64 bg-white rounded-lg shadow-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <Logo size="xl" />
              </div>
              <CardTitle className="text-3xl">
                {PAGE_HEADER.REGISTER_TITLE}
              </CardTitle>
              <CardDescription>
                {PAGE_HEADER.REGISTER_DESCRIPTION}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleRegister)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <EmailField
                        field={field}
                        onBlur={handleEmailBlur}
                        error={
                          form.formState.errors.email?.message || emailError
                        }
                        isCheckingEmail={isCheckingEmail}
                        loading={loading}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <NameField field={field} loading={loading} />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <PasswordField field={field} loading={loading} />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <ConfirmPasswordField field={field} loading={loading} />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneField field={field} loading={loading} />
                    )}
                  />

                  <TurnstileSection
                    onVerify={handleTurnstileVerify}
                    onError={handleTurnstileError}
                    onExpire={handleTurnstileExpire}
                    error={turnstileError}
                  />

                  <RegisterButton
                    loading={loading}
                    disabled={isButtonDisabled}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                {BUTTONS.HAS_ACCOUNT}{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  {BUTTONS.LOGIN_BUTTON}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
