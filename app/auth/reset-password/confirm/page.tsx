"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useTimeout } from "@/hooks/system/useTimeout";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Leaf } from "lucide-react";
import { PasswordField, AuthButton } from "@/components/auth";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";

import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { usePasswordRules } from "@/lib/utils/validation/usePasswordRules";
import {
  createResetPasswordFormSchema,
  createDefaultResetPasswordFormSchema,
  type ResetPasswordFormData,
} from "@/lib/utils/validation/auth-validation";

import { LottieLoadingCompact } from "@/components/ui/lottie-loading";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/auth";
import {
  getErrorMessage,
  mapRawErrorToCode,
} from "@/lib/utils/error/errorUtil";
import { PageLoading } from "@/components/ui/loading";

export default function ResetPasswordConfirmPage() {
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const router = useRouter();
  const { showSuccess, showError } = useCommonToast();
  const { signOut, changePassword } = useAuthActions();
  const searchParams = useSearchParams();
  const processingRef = useRef(false);

  // 시스템 설정에서 비밀번호 규칙 가져오기 (React Query 기반)
  const { rules: passwordRules, isLoading: isPasswordRulesLoading } =
    usePasswordRules();

  // 동적 스키마 생성
  useEffect(() => {
    if (isPasswordRulesLoading) return;

    try {
      const dynamicSchema = createResetPasswordFormSchema(passwordRules);
      setSchema(dynamicSchema);
    } catch (error) {
      devLog.error("Failed to create reset password schema:", error);
      // 에러 시 기본 스키마 사용
      setSchema(createDefaultResetPasswordFormSchema());
    }
  }, [passwordRules, isPasswordRulesLoading]);

  const form = useForm<ResetPasswordFormData>({
    resolver: schema
      ? zodResolver(schema)
      : zodResolver(createDefaultResetPasswordFormSchema()),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleEmailLink = useCallback(async () => {
    if (processingRef.current || tokenProcessed) {
      return;
    }

    const token = searchParams?.get("token");
    const type = searchParams?.get("type");

    if (!token || type !== "recovery") {
      setTokenLoading(false);
      setTokenError("유효하지 않은 재설정 링크입니다.");
      return;
    }

    setTokenLoading(true);
    processingRef.current = true;
    setTokenProcessed(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (error) {
        throw error;
      }

      showSuccess("인증 성공", "새로운 비밀번호를 입력해주세요.");
    } catch (error) {
      // 매핑된 에러 코드와 메시지 사용
      const code = mapRawErrorToCode(error);
      const message = getErrorMessage(code);

      setTokenError(message);
      showError("오류", message);

      setTimeout(() => {
        router.push("/auth/reset-password");
      }, 2000);
    } finally {
      setTokenLoading(false);
      processingRef.current = false;
    }
  }, [searchParams, tokenProcessed, showSuccess, showError, router]);

  const { isTimedOut, retry } = useTimeout(tokenLoading, {
    timeout: 15000,
    onRetry: handleEmailLink,
  });

  useEffect(() => {
    if (searchParams?.get("token")) {
      handleEmailLink();
    } else {
      setTokenLoading(false);
      setTokenError("비밀번호 재설정 링크가 유효하지 않습니다.");
    }
  }, [searchParams, handleEmailLink]);

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      const result = await changePassword({ newPassword: data.password });
      if (!result.success) {
        throw new Error(result.error || "비밀번호 변경에 실패했습니다.");
      }
      showSuccess(
        "비밀번호 변경 완료",
        "새로운 비밀번호로 변경되었습니다. 로그인해주세요."
      );
      await signOut();
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("오류", errorMessage);
    }
  };

  if (isTimedOut && !tokenProcessed && !tokenError) {
    return (
      <AdminError
        title={ERROR_CONFIGS.TIMEOUT.title}
        description={ERROR_CONFIGS.TIMEOUT.description}
        error={new Error("Token verification timeout")}
        retry={retry}
        isTimeout={true}
      />
    );
  }

  if (tokenLoading) {
    return (
      <PageLoading
        text={LABELS.LINK_CHECKING}
        subText={LABELS.LINK_CHECKING_DESCRIPTION}
        variant="lottie"
        fullScreen={true}
      />
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-soft-lg min-h-fit">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                <LottieLoadingCompact
                  animationPath="/lottie/admin_error.json"
                  size="md"
                />
              </div>
              <CardTitle className="text-2xl">
                {LABELS.LINK_ERROR_TITLE}
              </CardTitle>
              <CardDescription>{tokenError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/auth/reset-password")}
                className="w-full"
              >
                {BUTTONS.RETRY_REQUEST_BUTTON}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {PAGE_HEADER.RESET_PASSWORD_CONFIRM_TITLE}
              </CardTitle>
              <CardDescription>
                {PAGE_HEADER.RESET_PASSWORD_CONFIRM_DESCRIPTION}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <PasswordField
                        type="new"
                        field={field}
                        loading={loading}
                        showPasswordStrength={true}
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
                  <AuthButton
                    type="reset-password-confirm"
                    loading={loading}
                    className="h-12 w-full flex items-center justify-center"
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
