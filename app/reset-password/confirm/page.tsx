"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useTimeout } from "@/hooks/useTimeout";
import { AdminError } from "@/components/error/admin-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Leaf, Loader2, Lock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { getAuthErrorMessage } from "@/lib/utils/validation";
import { usePasswordRules } from "@/lib/utils/validation/usePasswordRules";
import {
  createResetPasswordFormSchema,
  createDefaultResetPasswordFormSchema,
  type ResetPasswordFormData,
} from "@/lib/utils/validation/auth-validation";

import { PasswordStrength } from "@/components/ui/password-strength";
import { Loading } from "@/components/ui/loading";

export default function ResetPasswordConfirmPage() {
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const router = useRouter();
  const { showSuccess, showError } = useCommonToast();
  const { signOut, changePassword } = useAuth();
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
      devLog.log("token:", token);
      devLog.log("type:", type);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (error) {
        throw error;
      }

      showSuccess("인증 성공", "새로운 비밀번호를 입력해주세요.");
    } catch (error: any) {
      const authError = getAuthErrorMessage(error);
      setTokenError(authError.message);
      showError("오류", authError.message);

      if (authError.shouldRedirect && authError.redirectTo) {
        setTimeout(() => {
          router.push(authError.redirectTo!);
        }, 2000);
      }
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
        window.location.href = "/login";
      }, 2000);
    } catch (error: any) {
      devLog.error("Password update error:", error);
      setLoading(false);
      const authError = getAuthErrorMessage(error);
      showError("오류", authError.message);
      if (authError.shouldRedirect && authError.redirectTo) {
        setTimeout(() => {
          router.push(authError.redirectTo!);
        }, 2000);
      }
    }
  };

  if (isTimedOut && !tokenProcessed && !tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <div className="w-full max-w-md">
          <AdminError
            title="토큰 검증 시간 초과"
            description="비밀번호 재설정 토큰 검증 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요."
            error={new Error("Token verification timeout")}
            retry={retry}
          />
        </div>
      </div>
    );
  }

  if (tokenLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Loading
                  spinnerSize={24}
                  showText={false}
                  minHeight="auto"
                  className="text-primary"
                />
              </div>
              <CardTitle className="text-2xl">링크 확인 중...</CardTitle>
              <CardDescription>
                비밀번호 재설정 링크를 확인하고 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">링크 오류</CardTitle>
              <CardDescription>{tokenError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/reset-password")}
                className="w-full"
              >
                다시 요청하기
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="비밀번호 재설정 페이지 오류"
      description="비밀번호 재설정 처리 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
              <CardDescription>새로운 비밀번호를 입력해주세요</CardDescription>
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
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
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
                    )}
                  />
                  <Button
                    type="submit"
                    className="h-12 w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loading
                          spinnerSize={16}
                          showText={false}
                          minHeight="auto"
                          className="mr-2"
                        />
                        비밀번호 변경 중...
                      </>
                    ) : (
                      "비밀번호 변경하기"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
