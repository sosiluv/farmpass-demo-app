"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useTimeout } from "@/hooks/system/useTimeout";
import { AdminError } from "@/components/error/admin-error";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { LABELS } from "@/lib/constants/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { AuthButton } from "@/components/auth";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Logo } from "@/components/common/logo";
import { LottieLoadingCompact } from "@/components/ui/lottie-loading";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import {
  getErrorMessage,
  mapRawErrorToCode,
} from "@/lib/utils/error/errorUtil";

export default function ConfirmPage() {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut } = useAuthActions();
  const { showSuccess, showError } = useCommonToast();
  const processingRef = useRef(false);

  const handleEmailConfirmation = useCallback(async () => {
    // 이미 처리 중이거나 완료된 경우 중복 실행 방지
    if (processingRef.current || tokenProcessed) {
      return;
    }

    const token = searchParams?.get("token");
    const type = searchParams?.get("type");

    if (!token || type !== "email") {
      setLoading(false);
      setError("유효하지 않은 이메일 확인 링크입니다.");
      return;
    }

    setLoading(true);
    processingRef.current = true;
    setTokenProcessed(true);

    try {
      // Rate limit 방지를 위한 지연
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 토큰으로 이메일 확인 처리
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });

      if (error) {
        throw error; // AuthApiError를 그대로 throw
      }

      if (data.user && data.session) {
        await signOut();
        setConfirmed(true);
        showSuccess(
          "이메일 인증 완료",
          "이메일 인증이 성공적으로 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다."
        );
      } else {
        throw new Error("이메일 인증 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      // 매핑된 에러 코드와 메시지 사용
      const code = mapRawErrorToCode(error, "auth");
      const message = getErrorMessage(code);

      setError(message);
      showError("인증 실패", message);

      setTimeout(() => {
        router.push("/auth/login");
      }, 4000);
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }, [searchParams, tokenProcessed, showSuccess, router]);

  const { isTimedOut, retry } = useTimeout(loading, {
    timeout: 15000, // 15초 타임아웃
    onRetry: handleEmailConfirmation,
  });

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (confirmed) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setTimeout(() => {
              router.push("/auth/login");
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [confirmed, router]);

  useEffect(() => {
    // URL에 토큰이 있을 때만 처리
    if (searchParams?.get("token")) {
      setLoading(true);
      handleEmailConfirmation();
    } else {
      setLoading(false);
      setError("이메일 확인 링크가 유효하지 않습니다.");
    }
  }, [searchParams, handleEmailConfirmation]);

  const handleGoToLogin = () => {
    router.push("/auth/login");
  };

  const handleResendConfirmation = () => {
    router.push("/auth/register");
  };

  // 타임아웃 상태 처리
  if (isTimedOut && !confirmed && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-3">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Logo className="mx-auto" size="xl" />
          </div>
          <AdminError
            title={ERROR_CONFIGS.TIMEOUT.title}
            description={ERROR_CONFIGS.TIMEOUT.description}
            error={new Error("Email verification timeout")}
            retry={retry}
            isTimeout={true}
          />
        </div>
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
          <div className="mb-8 text-center">
            <Logo className="mx-auto" size="xl" />
          </div>

          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {loading ? (
                  <LottieLoadingCompact size="sm" />
                ) : confirmed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {loading
                  ? LABELS.EMAIL_CONFIRMATION_LOADING
                  : confirmed
                  ? LABELS.EMAIL_CONFIRMATION_SUCCESS
                  : LABELS.EMAIL_CONFIRMATION_FAILED}
              </CardTitle>
              <CardDescription>
                {loading
                  ? LABELS.EMAIL_CONFIRMATION_PROCESSING
                  : confirmed
                  ? LABELS.EMAIL_CONFIRMATION_SUCCESS_DESC
                  : LABELS.EMAIL_CONFIRMATION_FAILED_DESC}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground w-full text-center">
                    {LABELS.EMAIL_CONFIRMATION_PROCESSING_MESSAGE}
                  </p>
                </div>
              )}

              {confirmed && (
                <div className="space-y-4 text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {LABELS.EMAIL_CONFIRMATION_ACTIVATED}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {countdown > 0 ? (
                        <>
                          <span className="font-medium text-primary">
                            {countdown}초
                          </span>{" "}
                          {LABELS.EMAIL_CONFIRMATION_REDIRECT}
                        </>
                      ) : (
                        LABELS.EMAIL_CONFIRMATION_REDIRECTING
                      )}
                    </p>
                  </div>
                  <AuthButton
                    type="email-confirm"
                    loading={false}
                    onClick={handleGoToLogin}
                    className="w-full"
                  />
                </div>
              )}

              {error && !loading && (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <div className="space-y-2">
                    <AuthButton
                      type="email-confirm"
                      loading={false}
                      onClick={handleGoToLogin}
                      variant="outline"
                      className="w-full"
                    />
                    <AuthButton
                      type="email-confirm"
                      loading={false}
                      onClick={handleResendConfirmation}
                      variant="outline"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
