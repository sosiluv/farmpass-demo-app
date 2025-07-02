"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { ErrorBoundary } from "@/components/error/error-boundary";
import {
  validatePassword,
  validatePasswordConfirm,
  getAuthErrorMessage,
} from "@/lib/utils/validation";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Loading } from "@/components/ui/loading";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordConfirmPage() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const router = useRouter();
  const toast = useCommonToast();
  const { signOut, changePassword } = useAuth();
  const searchParams = useSearchParams();
  const processingRef = useRef(false);

  useEffect(() => {
    // 이메일 링크의 토큰 처리
    const handleEmailLink = async () => {
      // 이미 처리 중이거나 완료된 경우 중복 실행 방지
      if (processingRef.current || tokenProcessed) {
        return;
      }

      const token = searchParams?.get("token");
      const type = searchParams?.get("type");

      if (!token || type !== "recovery") {
        return;
      }

      processingRef.current = true;
      setTokenProcessed(true);

      try {
        devLog.log("token:", token);
        devLog.log("type:", type);

        // Rate limit 방지를 위한 지연
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 토큰으로 세션 생성 및 검증
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "recovery",
        });

        if (error) {
          throw error; // AuthApiError를 그대로 throw
        }

        // 성공적으로 토큰 검증됨
        toast.showCustomSuccess("인증 성공", "새로운 비밀번호를 입력해주세요.");
      } catch (error: any) {
        const authError = getAuthErrorMessage(error);
        toast.showCustomError("오류", authError.message);

        // 리다이렉트가 필요한 경우
        if (authError.shouldRedirect && authError.redirectTo) {
          setTimeout(() => {
            router.push(authError.redirectTo!);
          }, 2000);
        }
      } finally {
        processingRef.current = false;
      }
    };

    handleEmailLink();
  }, [searchParams]); // router와 toast 의존성 제거

  const validateForm = async () => {
    const newErrors: FormErrors = {};

    // 비밀번호 유효성 검사
    const passwordValidation = await validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
    }

    // 비밀번호 확인 검증
    const confirmValidation = validatePasswordConfirm(
      formData.password,
      formData.confirmPassword
    );
    if (!confirmValidation.isValid) {
      newErrors.confirmPassword = confirmValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    setLoading(true);

    try {
      // Auth Provider의 통합 비밀번호 변경 함수 사용 (현재 비밀번호 검증 없이)
      const result = await changePassword({
        newPassword: formData.password,
      });

      if (!result.success) {
        throw new Error(result.error || "비밀번호 변경에 실패했습니다.");
      }

      // 성공 메시지 표시 - duration은 사용자 정의 옵션으로 showCustomSuccess 사용
      toast.showCustomSuccess(
        "비밀번호 변경 완료",
        "새로운 비밀번호로 변경되었습니다. 로그인해주세요."
      );

      // 로그아웃 처리 및 로그인 페이지로 리다이렉트
      await signOut();

      // 리다이렉트 전에 약간의 지연을 주어 토스트 메시지가 보이도록 함
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000); // 2초 후 리다이렉트
    } catch (error: any) {
      devLog.error("Password update error:", error);
      setLoading(false);

      // getAuthErrorMessage 함수를 사용하여 에러 처리
      const authError = getAuthErrorMessage(error);
      toast.showCustomError("오류", authError.message);

      // 리다이렉트가 필요한 경우
      if (authError.shouldRedirect && authError.redirectTo) {
        setTimeout(() => {
          router.push(authError.redirectTo!);
        }, 2000);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">새 비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className={`h-12 pl-10 input-focus ${
                        errors.password ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className={`h-12 pl-10 input-focus ${
                        errors.confirmPassword ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full"
                  disabled={loading}
                  onClick={(e) => {
                    if (loading) {
                      e.preventDefault();
                    }
                  }}
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
