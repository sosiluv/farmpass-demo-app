"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { Logo } from "@/components/common/logo";
import { PageLoading } from "@/components/ui/loading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  loginFormSchema,
  type LoginFormData,
} from "@/lib/utils/validation/auth-validation";
import { Form, FormField } from "@/components/ui/form";
import { EmailField, PasswordField, AuthButton } from "@/components/auth";
import {
  PAGE_HEADER,
  BUTTONS,
  PAGE_LOADING,
  SOCIAL_BUTTON_CONFIG,
} from "@/lib/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useNotificationService } from "@/hooks/notification/useNotificationService";
import { SocialLoginButton } from "@/components/ui/social-login-button";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { DemoLoginSection } from "@/components/auth/DemoLoginSection";
import { type DemoAccount } from "@/lib/constants/demo-accounts";

export default function LoginPage() {
  const {
    loading,
    checkingSession,
    setSessionChecked,
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
  const { showInfo, showSuccess } = useCommonToast();
  const { signOut } = useAuthActions();
  const { handleUnsubscription } = useNotificationService();

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
      // 이미 리다이렉트 중이면 세션 체크 하지 않음
      if (redirecting) {
        setSessionChecked();
        return;
      }

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
                await signOut();
                setRedirecting(false); // 리다이렉트하지 않고 로그인 페이지에 머물기
                setSessionChecked(); // 세션 확인 완료
                return;
              }

              // 유효한 세션이면 프로필과 약관 동의 상태를 확인한 후 리다이렉트
              setRedirecting(true);
              router.replace("/admin/dashboard");

              return;
            } catch (userError) {
              setRedirecting(false);
              setSessionChecked(); // 세션 확인 완료
              return;
            }
          }
          // 세션이 없으면 세션 확인 완료
          setSessionChecked();
        })();

        // 타임아웃과 함께 실행
        await Promise.race([sessionPromise, timeoutPromise]);
      } catch (error) {
        devLog.error("세션 확인 중 오류:", error);
        setSessionChecked(); // 오류 발생 시에도 세션 확인 완료
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
          await handleUnsubscription(); // 구독을 전달하지 않으면 내부에서 찾음
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
  }, [router, showInfo, signOut, redirecting]);

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

  // 로딩 상태 표시 (세션 확인 중 또는 리다이렉트 중일 때만)
  if (checkingSession || redirecting) {
    return (
      <PageLoading
        text={
          checkingSession
            ? PAGE_LOADING.CHECKING_SESSION
            : PAGE_LOADING.REDIRECTING_TO_DASHBOARD
        }
        subText={PAGE_LOADING.SUB_TEXT}
        variant="lottie"
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

  // 데모 계정 선택 핸들러
  const handleDemoAccountSelect = (account: DemoAccount) => {
    // 폼에 데모 계정 정보 자동 입력
    form.setValue("email", account.email);
    form.setValue("password", account.password);

    showSuccess(
      "계정 정보 입력 완료",
      `${account.name} 계정 정보가 입력되었습니다. 로그인 버튼을 클릭하세요.`
    );
  };

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
          className="w-full max-w-2xl"
        >
          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <Logo size="xl" />
              </div>
              <CardTitle className="text-2xl">
                {PAGE_HEADER.LOGIN_TITLE}
              </CardTitle>
              <CardDescription>{PAGE_HEADER.LOGIN_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 기존 로그인 폼 */}
                <div className="space-y-4">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleLogin)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <EmailField
                            field={field}
                            loading={loading || redirecting}
                            autoComplete="username"
                            showFormMessage={true}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <PasswordField
                            type="current"
                            field={field}
                            loading={loading || redirecting}
                            showPasswordStrength={false}
                          />
                        )}
                      />
                      {formError && (
                        <p className="text-sm text-red-500">{formError}</p>
                      )}
                      <AuthButton
                        type="login"
                        loading={loading}
                        redirecting={redirecting}
                        className="h-12 w-full"
                      />
                      <div className="flex items-center my-4">
                        <div className="flex-grow h-px bg-gray-200" />
                        <span className="mx-3 text-xs text-gray-400">또는</span>
                        <div className="flex-grow h-px bg-gray-200" />
                      </div>
                      {/* 소셜 로그인 버튼들 */}
                      <div className="space-y-4">
                        {SOCIAL_BUTTON_CONFIG.map((btn) => {
                          const loading =
                            btn.provider === "kakao"
                              ? kakaoLoading
                              : googleLoading;
                          const onClick =
                            btn.provider === "kakao"
                              ? handleKakaoLogin
                              : handleGoogleLogin;
                          const disabled = loading || redirecting;
                          return (
                            <SocialLoginButton
                              key={btn.provider}
                              {...btn}
                              loading={loading}
                              onClick={onClick}
                              disabled={disabled}
                            />
                          );
                        })}
                      </div>
                    </form>
                  </Form>
                </div>

                {/* 데모 로그인 섹션 */}
                <div className="lg:border-l lg:pl-6">
                  <DemoLoginSection
                    onAccountSelect={handleDemoAccountSelect}
                    loading={loading || redirecting}
                  />
                </div>
              </div>
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
