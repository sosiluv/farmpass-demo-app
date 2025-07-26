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
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { Logo } from "@/components/common";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { PageLoading } from "@/components/ui/loading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  LABELS,
  PLACEHOLDERS,
  PAGE_HEADER,
  BUTTONS,
} from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // 세션 만료 시 URL 파라미터 정리 (일반 웹서비스 방식: 구독은 유지)
  useEffect(() => {
    // URL 파라미터로 세션 만료 여부 확인
    const urlParams = new URLSearchParams(window.location.search);
    const sessionExpired = urlParams.get("session_expired");

    if (sessionExpired === "true") {
      devLog.log("[LOGIN] 세션 만료로 인한 로그인 페이지 진입 - 구독은 유지");

      // URL에서 파라미터 제거 (구독 관련 처리는 하지 않음)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("session_expired");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  // 로딩 상태별 적절한 텍스트 표시
  if (
    state.status === "loading" ||
    state.status === "initializing" ||
    redirecting
  ) {
    let loadingText = "페이지를 불러오는 중...";

    if (redirecting) {
      loadingText = "대시보드로 이동 중...";
    } else if (state.status === "initializing") {
      loadingText = "시스템을 초기화하는 중...";
    } else if (state.status === "loading") {
      loadingText = "로그인 상태를 확인하는 중...";
    }

    return (
      <PageLoading
        text={loadingText}
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
      // Safari 재시도 로직 제거, signIn 직접 호출
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        showSuccess("로그인 성공", result.message || "대시보드로 이동합니다.");
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

  // 공통 소셜 로그인 핸들러
  const handleSocialLogin = async (
    provider: "kakao" | "google",
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
    } finally {
      // 실제로는 리다이렉트가 발생하므로 setLoading(false)는 필요 없음
    }
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    if (kakaoLoading || redirecting) return;
    handleSocialLogin("kakao", setKakaoLoading);
  };

  // 구글 로그인 핸들러
  const handleGoogleLogin = () => {
    if (googleLoading || redirecting) return;
    handleSocialLogin("google", setGoogleLoading);
  };

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
                {PAGE_HEADER.LOGIN_TITLE}
              </CardTitle>
              <CardDescription>{PAGE_HEADER.LOGIN_DESCRIPTION}</CardDescription>
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
                          {LABELS.EMAIL} <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder={PLACEHOLDERS.EMAIL}
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
                          {LABELS.PASSWORD}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder={PLACEHOLDERS.PASSWORD}
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
                        {redirecting
                          ? BUTTONS.REDIRECTING
                          : BUTTONS.LOGIN_LOADING}
                      </>
                    ) : (
                      BUTTONS.LOGIN_BUTTON
                    )}
                  </Button>
                  {/* 카카오 로그인 버튼 */}
                  <Button
                    type="button"
                    onClick={handleKakaoLogin}
                    className="w-full h-12 min-h-[48px] rounded-md shadow-sm relative flex items-center justify-center"
                    style={{
                      background: "#FEE500",
                      color: "#191600",
                      border: "1px solid #e0e0e0",
                      marginTop: 8,
                      fontWeight: 600,
                      padding: 0,
                    }}
                    disabled={kakaoLoading || redirecting}
                  >
                    {kakaoLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {BUTTONS.LOGIN_LOADING}
                      </div>
                    ) : (
                      <>
                        <img
                          src="/btn_kakao.svg"
                          alt={BUTTONS.KAKAO_LOGIN}
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6"
                        />
                        <span className="w-full text-center block">
                          {BUTTONS.KAKAO_LOGIN}
                        </span>
                      </>
                    )}
                  </Button>
                  {/* 구글 로그인 버튼 */}
                  <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 min-h-[48px] rounded-md shadow-sm relative flex items-center justify-center"
                    style={{
                      background: "#fff",
                      color: "#191600",
                      border: "1px solid #e0e0e0",
                      marginTop: 8,
                      fontWeight: 600,
                      padding: 0,
                    }}
                    disabled={googleLoading || redirecting}
                  >
                    {googleLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {BUTTONS.LOGIN_LOADING}
                      </div>
                    ) : (
                      <>
                        <img
                          src="/btn_google.svg"
                          alt={BUTTONS.GOOGLE_LOGIN}
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6"
                        />
                        <span className="w-full text-center block">
                          {BUTTONS.GOOGLE_LOGIN}
                        </span>
                      </>
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
                  {BUTTONS.FORGOT_PASSWORD}
                </Link>
              </div>
              <div className="text-center text-sm">
                {BUTTONS.NO_ACCOUNT}{" "}
                <Link href="/register" className="text-primary hover:underline">
                  {BUTTONS.REGISTER_BUTTON}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
