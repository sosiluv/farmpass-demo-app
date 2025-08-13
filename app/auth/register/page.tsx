"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { usePasswordRules } from "@/lib/utils/validation/usePasswordRules";
import { apiClient } from "@/lib/utils/data/api-client";
import { checkEmailDuplicate } from "@/lib/utils/validation";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import {
  createRegistrationFormSchema,
  createDefaultRegistrationFormSchema,
  type RegistrationFormData,
} from "@/lib/utils/validation/auth-validation";
import { Logo } from "@/components/common/logo";
import { BUTTONS, PAGE_HEADER } from "@/lib/constants/auth";
import {
  EmailField,
  NameField,
  PasswordField,
  PhoneField,
  TermsConsentSheet,
  TurnstileSection,
  AuthButton,
} from "@/components/auth";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<string>("");
  const [showConsentSheet, setShowConsentSheet] = useState(false);
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
        privacyConsent: false,
        termsConsent: false,
        marketingConsent: false,
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
  const handleRegister = useCallback(async () => {
    // 캡차 인증 확인
    if (!turnstileToken) {
      setTurnstileError("캡차 인증을 완료해주세요.");
      return;
    }

    // 약관 동의 bottom sheet 모달 표시
    setShowConsentSheet(true);
  }, [turnstileToken]);

  // 약관 동의 후 실제 회원가입 처리
  const handleConsentSubmit = useCallback(
    async (
      privacyConsent: boolean,
      termsConsent: boolean,
      marketingConsent: boolean
    ) => {
      if (!privacyConsent || !termsConsent) {
        showError("약관 동의 필요", "필수 약관에 동의해주세요.");
        return;
      }

      showInfo("회원가입 시도 중", "잠시만 기다려주세요.");
      setLoading(true);

      try {
        const formData = form.getValues();

        // 새로운 회원가입 API 호출
        const response = await apiClient("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            name: formData.name,
            phone: formData.phone,
            turnstileToken: turnstileToken,
            privacyConsent: privacyConsent,
            termsConsent: termsConsent,
            marketingConsent: marketingConsent,
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
          setShowConsentSheet(false);
          router.push("/auth/login");
        } else {
          throw new Error(response.message || "회원가입에 실패했습니다.");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.";
        setEmailError(errorMessage);
        showError("회원가입 실패", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [turnstileToken, showInfo, showSuccess, showError, router, signOut, form]
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
              <CardTitle className="text-2xl">
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
                      <PasswordField
                        type="new"
                        field={field}
                        loading={loading}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <PasswordField
                        type="confirm"
                        field={field}
                        loading={loading}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneField field={field} loading={loading} />
                    )}
                  />

                  {/* 약관 동의는 bottom sheet 모달에서 처리 */}

                  <TurnstileSection
                    onVerify={handleTurnstileVerify}
                    onError={handleTurnstileError}
                    onExpire={handleTurnstileExpire}
                    error={turnstileError}
                  />

                  <AuthButton
                    type="register"
                    loading={loading}
                    disabled={isButtonDisabled}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col">
              <div className="mt-2 text-center text-sm">
                {BUTTONS.HAS_ACCOUNT}{" "}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline"
                >
                  {BUTTONS.LOGIN_BUTTON}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* 약관 동의 Bottom Sheet 모달 */}
      <TermsConsentSheet
        open={showConsentSheet}
        onOpenChange={setShowConsentSheet}
        onConsent={handleConsentSubmit}
        loading={loading}
      />
    </ErrorBoundary>
  );
}
