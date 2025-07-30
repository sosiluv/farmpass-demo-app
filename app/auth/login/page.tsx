"use client";

import type React from "react";
import { useEffect } from "react";
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
  SOCIAL_BUTTON_CONFIG,
} from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useSubscriptionManager } from "@/hooks/notification/useSubscriptionManager";
import { SocialLoginButton } from "@/components/common/SocialLoginButton";
import { useLoginForm } from "@/hooks/auth/useLoginForm";

export default function LoginPage() {
  const {
    loading,
    kakaoLoading,
    setKakaoLoading,
    googleLoading,
    setGoogleLoading,
    formError,
    redirecting,
    setRedirecting,
    handleLogin,
    handleSocialLogin,
  } = useLoginForm();

  const router = useRouter();
  const { showInfo } = useCommonToast();
  const { signOut } = useAuthActions();
  const { cleanupSubscription } = useSubscriptionManager();

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
      // 타임아웃 설정 (5초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("세션 확인 타임아웃")), 5000);
      });

      try {
        const sessionPromise = (async () => {
          const supabase = createClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // 추가 세션 유효성 검증
            try {
              const {
                data: { user },
                error,
              } = await supabase.auth.getUser();

              // 세션은 있지만 유저 정보를 가져올 수 없으면 세션이 유효하지 않음
              if (error || !user) {
                devLog.warn("세션은 있지만 유저 정보 검증 실패, 로그아웃 처리");
                await signOut();
                setRedirecting(true);
                router.replace("/admin/dashboard");
                return;
              }

              // 유효한 세션이면 대시보드로 리다이렉트
              setRedirecting(true);
              router.replace("/admin/dashboard");
              return;
            } catch (userError) {
              devLog.warn("사용자 정보 검증 중 오류:", userError);
              setRedirecting(false);
              return;
            }
          }
        })();

        // 타임아웃과 함께 실행
        await Promise.race([sessionPromise, timeoutPromise]);
      } catch (error) {
        devLog.error("세션 확인 중 오류:", error);
      } finally {
        // setCheckingSession(false); // 이 부분은 useLoginForm에서 관리
      }
    };

    // URL 파라미터로 세션 만료 여부 확인
    const urlParams = new URLSearchParams(window.location.search);
    const sessionExpired = urlParams.get("session_expired");

    if (sessionExpired === "true") {
      devLog.log(
        "[LOGIN] 세션 만료로 인한 로그인 페이지 진입 - 구독 해제 수행"
      );

      // 세션 만료 시 브라우저 구독 해제 수행
      const handleSessionExpiredCleanup = async () => {
        try {
          await cleanupSubscription();
          devLog.log("[LOGIN] 세션 만료로 인한 구독 해제 완료");
        } catch (error) {
          devLog.error("[LOGIN] 세션 만료 시 구독 해제 실패:", error);
        }
      };

      // 구독 해제 실행
      handleSessionExpiredCleanup();

      // URL에서 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("session_expired");
      window.history.replaceState({}, "", newUrl.toString());

      showInfo(
        "세션 만료",
        "보안을 위해 자동으로 로그아웃되었습니다. 다시 로그인해주세요."
      );
    }

    checkSession();
  }, [router, showInfo]);

  // 소셜 로그인 무한 로딩 방지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 페이지가 다시 보이게 되면 로딩 상태 리셋
        setKakaoLoading(false);
        setGoogleLoading(false);
        devLog.log("[LOGIN] 페이지 포커스 - 소셜 로그인 로딩 상태 리셋");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 로딩 상태 표시 (세션 확인 중, 로그인 중, 또는 리다이렉트 중일 때)
  if (loading || redirecting) {
    return (
      <PageLoading
        text={
          loading
            ? BUTTONS.LOGIN_LOADING
            : redirecting
            ? PAGE_LOADING.REDIRECTING_TO_DASHBOARD
            : PAGE_LOADING.CHECKING_SESSION
        }
        subText={PAGE_LOADING.SUB_TEXT}
        variant="gradient"
        fullScreen={true}
      />
    );
  }

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
                  <div className="flex items-center my-3">
                    <div className="flex-grow h-px bg-gray-200" />
                    <span className="mx-3 text-xs text-gray-400">또는</span>
                    <div className="flex-grow h-px bg-gray-200" />
                  </div>
                  {/* 소셜 로그인 버튼들 */}
                  {SOCIAL_BUTTON_CONFIG.map((btn, idx) => {
                    const loading =
                      btn.provider === "kakao" ? kakaoLoading : googleLoading;
                    const onClick =
                      btn.provider === "kakao"
                        ? handleKakaoLogin
                        : handleGoogleLogin;
                    const disabled = loading || redirecting;
                    return (
                      <>
                        <SocialLoginButton
                          {...btn}
                          loading={loading}
                          onClick={onClick}
                          disabled={disabled}
                        />
                      </>
                    );
                  })}
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
