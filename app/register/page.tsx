"use client";

import type React from "react";
import { useState } from "react";
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
import { Mail, User, Lock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import {
  validateRegistrationForm,
  checkEmailDuplicate,
  getRegistrationErrorMessage,
  validateEmail,
} from "@/lib/utils/validation";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Logo } from "@/components/common";
import { Loading } from "@/components/ui/loading";

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const router = useRouter();
  const toast = useCommonToast();

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    if (!email) return;

    // 이메일 형식 검증
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setErrors((prev) => ({ ...prev, email: emailValidation.message }));
      return;
    }

    // 이메일 중복 검사
    setIsCheckingEmail(true);
    try {
      const duplicateCheck = await checkEmailDuplicate(email);
      if (!duplicateCheck.isValid) {
        setErrors((prev) => ({ ...prev, email: duplicateCheck.message }));
      }
    } catch (error) {
      devLog.error("Email check error:", error);
      setErrors((prev) => ({
        ...prev,
        email: "이메일 확인 중 오류가 발생했습니다.",
      }));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.showInfo("회원가입 시도 중", "잠시만 기다려주세요.");

    // 폼 유효성 검증
    const validation = await validateRegistrationForm(formData);
    if (!validation.isValid) {
      toast.showWarning("입력 오류", "입력값을 확인해주세요.");
      setErrors(validation.errors);
      return;
    }

    // 이메일 중복 검사
    const emailValidation = await checkEmailDuplicate(formData.email);
    if (!emailValidation.isValid) {
      setErrors((prev) => ({ ...prev, email: emailValidation.message }));
      return;
    }

    setLoading(true);

    try {
      // Supabase auth를 통한 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("회원가입에 실패했습니다.");

      toast.showCustomSuccess("회원가입이 완료되었습니다.", "로그인해주세요.");

      router.push("/login");
    } catch (error: any) {
      devLog.error("Registration failed:", error);
      const errorMessage = getRegistrationErrorMessage(error);
      setErrors({ email: errorMessage });

      toast.showCustomError("회원가입 실패", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary
      title="회원가입 페이지 오류"
      description="회원가입 처리 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
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
              <CardTitle className="text-3xl">회원가입</CardTitle>
              <CardDescription>
                농장 출입 관리 시스템에 가입하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    아이디(이메일) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      required
                      autoComplete="username"
                      className={`h-12 pl-10 input-focus ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      disabled={loading || isCheckingEmail}
                    />
                    {isCheckingEmail && (
                      <Loading
                        spinnerSize={16}
                        showText={false}
                        minHeight="auto"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">
                    이름 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="name"
                      className={`h-12 pl-10 input-focus ${
                        errors.name ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    비밀번호 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="new-password"
                      className={`h-12 pl-10 input-focus ${
                        errors.password ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
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

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">
                    휴대폰 번호 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={`h-12 pl-10 input-focus ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full"
                  disabled={loading || !!errors.email}
                >
                  {loading ? (
                    <>
                      <Loading
                        spinnerSize={16}
                        showText={false}
                        minHeight="auto"
                        className="mr-2"
                      />
                      가입 중...
                    </>
                  ) : (
                    "회원가입"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-center text-sm">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  로그인
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
