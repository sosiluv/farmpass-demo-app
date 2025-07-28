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
  PAGE_LOADING,
} from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { useAuthActions } from "@/hooks/useAuthActions";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();
  const { signIn } = useAuthActions();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 세션 확인 및 세션 만료 파라미터 정리
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // 이미 로그인된 사용자는 대시보드로 리다이렉트
          setRedirecting(true);
          setCheckingSession(false);
          router.replace("/admin/dashboard");
          return;
        }
      } catch (error) {
        devLog.error("세션 확인 중 오류:", error);
      } finally {
        setCheckingSession(false);
      }
    };

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

    checkSession();
  }, [router]);

  // 로딩 상태 표시 (세션 확인 중, 로그인 중, 또는 리다이렉트 중일 때)
  if (checkingSession || loading || redirecting) {
    return (
      <PageLoading
        text={
          checkingSession
            ? PAGE_LOADING.CHECKING_SESSION
            : redirecting
            ? PAGE_LOADING.REDIRECTING_TO_DASHBOARD
            : BUTTONS.LOGIN_LOADING
        }
        subText={PAGE_LOADING.SUB_TEXT}
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
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      if (result.success) {
        showSuccess("로그인 성공", result.message || "대시보드로 이동합니다.");
        setRedirecting(true);
        router.replace("/admin/dashboard");
        return;
      }
    } catch (error: any) {
      devLog.error("Login failed:", error);

      const authError = getAuthErrorMessage(error);
      setFormError(authError.message);
      showError("로그인 실패", authError.message);
      setRedirecting(false);
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

      // 카카오와 구글 모두 계정 선택 화면 강제 표시
      const oauthOptions = {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          prompt: "select_account", // 계정 선택 화면 강제 표시
        },
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });

      if (error) {
        devLog.error(`${provider} 로그인 오류:`, error);
        setLoading(false);
        showError(`${provider} 로그인 실패`, error.message);
      }
      // 성공 시에는 리다이렉트가 발생하므로 로딩 상태를 유지
    } catch (error) {
      devLog.error(`${provider} 로그인 예외:`, error);
      setLoading(false);
      showError(`${provider} 로그인 실패`, "로그인 중 오류가 발생했습니다.");
    }
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    if (kakaoLoading) return;
    handleSocialLogin("kakao", setKakaoLoading);
  };

  // 구글 로그인 핸들러
  const handleGoogleLogin = () => {
    if (googleLoading) return;
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
                  href="/auth/reset-password"
                  className="text-primary hover:underline"
                >
                  {BUTTONS.FORGOT_PASSWORD}
                </Link>
              </div>
              <div className="text-center text-sm">
                {BUTTONS.NO_ACCOUNT}{" "}
                <Link
                  href="/auth/register"
                  className="text-primary hover:underline"
                >
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
