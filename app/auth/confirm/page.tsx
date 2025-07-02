"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Logo } from "@/components/common";
import { Loading } from "@/components/ui/loading";
import { getAuthErrorMessage } from "@/lib/utils/validation";

export default function ConfirmPage() {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useCommonToast();
  const processingRef = useRef(false);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (confirmed) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setTimeout(() => {
              router.push("/login");
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
    const handleEmailConfirmation = async () => {
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
          setConfirmed(true);
          toast.showCustomSuccess(
            "이메일 인증 완료",
            "이메일 인증이 성공적으로 완료되었습니다. 잠시 후 로그인 페이지로 이동합니다."
          );
        } else {
          throw new Error("이메일 인증 처리 중 오류가 발생했습니다.");
        }
      } catch (error: any) {
        const authError = getAuthErrorMessage(error);
        setError(authError.message);
        toast.showCustomError("인증 실패", authError.message);

        // 리다이렉트가 필요한 경우
        if (authError.shouldRedirect && authError.redirectTo) {
          setTimeout(() => {
            router.push(authError.redirectTo!);
          }, 2000);
        }
      } finally {
        setLoading(false);
        processingRef.current = false;
      }
    };

    // URL에 토큰이 있을 때만 처리
    if (searchParams?.get("token")) {
      handleEmailConfirmation();
    } else {
      setLoading(false);
      setError("이메일 확인 링크가 유효하지 않습니다.");
    }
  }, [searchParams]); // toast와 router 의존성 제거

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleResendConfirmation = () => {
    router.push("/register");
  };

  return (
    <ErrorBoundary
      title="이메일 인증 페이지 오류"
      description="이메일 인증 처리 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <Logo className="mx-auto h-12 w-auto" />
          </div>

          <Card className="border-none shadow-soft-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {loading ? (
                  <Loading
                    spinnerSize={24}
                    showText={false}
                    minHeight="auto"
                    className="text-primary"
                  />
                ) : confirmed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {loading
                  ? "이메일 인증 중..."
                  : confirmed
                  ? "인증 완료!"
                  : "인증 실패"}
              </CardTitle>
              <CardDescription>
                {loading
                  ? "이메일 인증을 처리하고 있습니다."
                  : confirmed
                  ? "이메일 인증이 성공적으로 완료되었습니다."
                  : "이메일 인증에 실패했습니다."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loading
                    spinnerSize={24}
                    showText={false}
                    minHeight="auto"
                    className="text-primary"
                  />
                </div>
              )}

              {confirmed && (
                <div className="space-y-4 text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      계정이 활성화되었습니다! 🎉
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {countdown > 0 ? (
                        <>
                          <span className="font-medium text-primary">
                            {countdown}초
                          </span>{" "}
                          후 로그인 페이지로 자동 이동합니다.
                        </>
                      ) : (
                        "로그인 페이지로 이동 중..."
                      )}
                    </p>
                  </div>
                  <Button onClick={handleGoToLogin} className="w-full">
                    {countdown > 0 ? "지금 바로 로그인하기" : "로그인하기"}
                  </Button>
                </div>
              )}

              {error && !loading && (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <div className="space-y-2">
                    <Button
                      onClick={handleGoToLogin}
                      variant="outline"
                      className="w-full"
                    >
                      로그인 페이지로 이동
                    </Button>
                    <Button
                      onClick={handleResendConfirmation}
                      variant="ghost"
                      className="w-full"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      다시 회원가입하기
                    </Button>
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
