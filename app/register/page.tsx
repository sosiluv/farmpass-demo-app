"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
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
import { Mail, User, Lock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { apiClient } from "@/lib/utils/data";
import {
  checkEmailDuplicate,
  getRegistrationErrorMessage,
  getPasswordRules,
} from "@/lib/utils/validation";
import {
  createRegistrationFormSchema,
  createDefaultRegistrationFormSchema,
  type RegistrationFormData,
} from "@/lib/utils/validation/auth-validation";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Logo, Turnstile } from "@/components/common";
import { Loading } from "@/components/ui/loading";

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
        캡차 인증 <span className="text-red-500">*</span>
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
        이메일 <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="email"
            placeholder="name@example.com"
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
        이름 <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="text"
            placeholder="홍길동"
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
        비밀번호 <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="password"
            placeholder="비밀번호를 입력하세요"
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
        비밀번호 확인 <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
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
        휴대폰 번호 <span className="text-red-500">*</span>
      </FormLabel>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <FormControl>
          <Input
            {...field}
            type="tel"
            placeholder="010-0000-0000"
            className="h-12 pl-10 input-focus"
            disabled={loading}
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
    <Button type="submit" className="h-12 w-full" disabled={disabled}>
      {loading ? (
        <>
          <Loading
            spinnerSize={16}
            showText={false}
            minHeight="auto"
            className="mr-2"
          />
          가입 중...
        </>
      ) : (
        "회원가입"
      )}
    </Button>
  )
);

RegisterButton.displayName = "RegisterButton";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [schema, setSchema] = useState<any>(null);
  const [isSchemaLoading, setIsSchemaLoading] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<string>("");
  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();

  // 시스템 설정에 따른 동적 스키마 생성 - 최적화됨
  useEffect(() => {
    const initSchema = async () => {
      if (schema) return; // 이미 로드된 경우 스킵

      try {
        setIsSchemaLoading(true);
        const passwordRules = await getPasswordRules();
        const dynamicSchema = createRegistrationFormSchema(passwordRules);
        setSchema(dynamicSchema);
      } catch (error) {
        devLog.error("Failed to load password rules:", error);
        // 에러 시 기본 스키마 사용
      } finally {
        setIsSchemaLoading(false);
      }
    };
    initSchema();
  }, [schema]);

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

      // 이메일 중복 검사
      const emailValidation = await checkEmailDuplicate(data.email);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.message);
        return;
      }

      setLoading(true);

      try {
        // Turnstile 토큰 검증
        const verificationResult = await fetch("/api/auth/verify-turnstile", {
          method: "POST",
          body: JSON.stringify({ token: turnstileToken }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!verificationResult.ok) {
          const errorData = await verificationResult.json();
          setTurnstileError(errorData.error || "캡차 인증에 실패했습니다.");
          return;
        }

        // Supabase auth를 통한 사용자 생성
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: data.email,
            password: data.password,
            options: {
              data: {
                name: data.name,
                phone: data.phone,
              },
            },
          }
        );

        if (authError) throw authError;
        if (!authData.user) throw new Error("회원가입에 실패했습니다.");

        // 회원가입 후 자동 로그아웃 (Supabase signUp이 자동 로그인을 하기 때문)
        //await supabase.auth.signOut();

        showSuccess(
          "회원가입이 완료되었습니다.",
          "이메일 인증 후 로그인해주세요."
        );

        router.push("/login");
      } catch (error: any) {
        devLog.error("Registration failed:", error);
        const errorMessage = getRegistrationErrorMessage(error);
        setEmailError(errorMessage);

        showError("회원가입 실패", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [turnstileToken, showInfo, showSuccess, showError, router]
  );

  // 메모이제이션된 버튼 비활성화 상태
  const isButtonDisabled = useMemo(() => {
    return loading || !!emailError || !turnstileToken;
  }, [loading, emailError, turnstileToken]);

  // 스키마 로딩 중이면 스켈레톤 표시
  if (isSchemaLoading) {
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
      title="회원가입 페이지 오류"
      description="회원가입 처리 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
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
              <CardTitle className="text-3xl">회원가입</CardTitle>
              <CardDescription>
                농장 출입 관리 시스템에 가입하세요
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
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  로그인
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
