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
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useAuth } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Logo } from "@/components/common";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const toast = useCommonToast();
  const { state, signIn } = useAuth();

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

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (state.status === "authenticated") {
      // 로딩 화면 없이 즉시 리다이렉트
      router.replace("/admin/dashboard");
    }
  }, [state.status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    toast.showInfo("로그인 시도 중", "잠시만 기다려주세요.");

    try {
      // Auth Provider에서 모든 로그인 로직 처리
      const result = await signIn({
        email: email,
        password: password,
      });

      if (result.success) {
        toast.showCustomSuccess("로그인 성공", "대시보드로 이동합니다.");
        setRedirecting(true); // 리다이렉트 시작
        // 즉시 리다이렉트 (setTimeout 제거)
        router.replace("/admin/dashboard");
        return; // setLoading(false) 실행 방지
      }
    } catch (error: any) {
      devLog.error("Login failed:", error);
      const authError = getAuthErrorMessage(error);
      const errorMessage = authError.message;
      setErrors({ email: errorMessage });
      toast.showCustomError("로그인 실패", errorMessage);

      if (authError.code === "INVALID_PASSWORD") {
        toast.showWarning("비밀번호 오류", "비밀번호가 올바르지 않습니다.");
      }

      // 로그인 실패 시 입력 필드 초기화하지 않음 (사용자가 다시 시도할 수 있도록)
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={handleInputChange}
                      required
                      autoComplete="username"
                      className={`h-12 pl-10 input-focus ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      disabled={loading || redirecting}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={handleInputChange}
                      required
                      autoComplete="current-password"
                      className={`h-12 pl-10 input-focus ${
                        errors.password ? "border-red-500" : ""
                      }`}
                      disabled={loading || redirecting}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full"
                  disabled={loading || redirecting}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>
              </form>
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
