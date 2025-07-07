"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useAuth } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Logo } from "@/components/common";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { PageLoading } from "@/components/ui/loading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { safariLoginRetry } from "@/lib/utils/browser/safari-debug";

import {
  loginFormSchema,
  type LoginFormData,
} from "@/lib/utils/validation/auth-validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();
  const { state, signIn } = useAuth();

  // 인증된 사용자 리다이렉트를 useEffect로 처리 (redirecting 상태 고려)
  useEffect(() => {
    if (state.status === "authenticated" && !loading && !redirecting) {
      setRedirecting(true);
      router.replace("/admin/dashboard");
    }
  }, [state.status, router, loading, redirecting]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 세션 만료로 인한 로그인 페이지 진입 시 브라우저 구독 정리
  useEffect(() => {
    const cleanupBrowserSubscriptions = async () => {
      try {
        // Service Worker 등록 확인
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            // 기존 구독 해제
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
              devLog.log("[LOGIN] Browser push subscription cleaned");
            }
          }
        }
      } catch (error) {
        devLog.warn("[LOGIN] Failed to clean browser subscriptions:", error);
      }
    };

    // URL 파라미터로 세션 만료 여부 확인
    const urlParams = new URLSearchParams(window.location.search);
    const sessionExpired = urlParams.get("session_expired");

    if (sessionExpired === "true") {
      cleanupBrowserSubscriptions();
      // URL에서 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("session_expired");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  // 로딩 상태를 먼저 체크 (페이지 렌더링 전에)
  if (
    state.status === "loading" ||
    state.status === "initializing" ||
    redirecting
  ) {
    return (
      <PageLoading
        text={
          redirecting
            ? "대시보드로 이동 중..."
            : state.status === "initializing"
            ? "인증 확인 중..."
            : "자동 로그인 중..."
        }
        subText="잠시만 기다려주세요"
        variant="gradient"
        fullScreen={true}
      />
    );
  }

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setFormError("");
    showInfo("로그인 시도 중", "잠시만 기다려주세요.");

    try {
      // Safari에서 재시도 로직을 포함한 로그인 수행
      const result = await safariLoginRetry(async () => {
        return await signIn({
          email: data.email,
          password: data.password,
        });
      });

      if (result.success) {
        showSuccess("로그인 성공", "대시보드로 이동합니다.");
        // 리다이렉트는 useEffect에서 처리하므로 여기서는 제거
        // setRedirecting(true);
        // router.replace("/admin/dashboard");
        return;
      }
    } catch (error: any) {
      devLog.error("Login failed:", error);

      const authError = getAuthErrorMessage(error);
      setFormError(authError.message);
      showError("로그인 실패", authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary
      title="로그인 페이지 오류"
      description="로그인 처리 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
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
              <CardTitle className="text-3xl">로그인</CardTitle>
              <CardDescription>
                농장 출입 관리 시스템에 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-800">
                          아이디(이메일) <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="name@example.com"
                              autoComplete="username"
                              className="h-12 pl-10 input-focus"
                              disabled={loading || redirecting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                              autoComplete="current-password"
                              className="h-12 pl-10 input-focus"
                              disabled={loading || redirecting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {formError && (
                    <p className="text-sm text-red-500">{formError}</p>
                  )}
                  <Button
                    type="submit"
                    className="h-12 w-full"
                    disabled={loading || redirecting}
                  >
                    {loading || redirecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {redirecting ? "이동 중..." : "로그인 중..."}
                      </>
                    ) : (
                      "로그인"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-center text-sm">
                <Link
                  href="/reset-password"
                  className="text-primary hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <div className="text-center text-sm">
                계정이 없으신가요?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  회원가입
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
