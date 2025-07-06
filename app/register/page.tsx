"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, User, Lock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import {
  checkEmailDuplicate,
  getRegistrationErrorMessage,
  getPasswordRules,
} from "@/lib/utils/validation";
import {
  createRegistrationFormSchema,
  createDefaultRegistrationFormSchema,
  type RegistrationFormData,
} from "@/lib/utils/validation/auth-validation";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Logo } from "@/components/common";
import { Loading } from "@/components/ui/loading";
import {
  AUTH_LABELS,
  AUTH_PLACEHOLDERS,
  AUTH_GUIDE_MESSAGES,
} from "@/lib/constants/auth";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [schema, setSchema] = useState<any>(null);
  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();

  // 시스템 설정에 따른 동적 스키마 생성
  useEffect(() => {
    const initSchema = async () => {
      try {
        const passwordRules = await getPasswordRules();
        const dynamicSchema = createRegistrationFormSchema(passwordRules);
        setSchema(dynamicSchema);
      } catch (error) {
        devLog.error("Failed to load password rules:", error);
        // 에러 시 기본 스키마 사용
      }
    };
    initSchema();
  }, []);

  const form = useForm<RegistrationFormData>({
    resolver: schema
      ? zodResolver(schema)
      : zodResolver(createDefaultRegistrationFormSchema()),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const handleEmailBlur = async () => {
    const email = form.getValues("email").trim();
    if (!email) return;

    // 이메일 중복 검사
    setIsCheckingEmail(true);
    try {
      const duplicateCheck = await checkEmailDuplicate(email);
      if (!duplicateCheck.isValid) {
        setEmailError(duplicateCheck.message);
      } else {
        setEmailError("");
      }
    } catch (error) {
      devLog.error("Email check error:", error);
      setEmailError("이메일 확인 중 오류가 발생했습니다.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleRegister = async (data: RegistrationFormData) => {
    showInfo("회원가입 시도 중", "잠시만 기다려주세요.");

    // 이메일 중복 검사
    const emailValidation = await checkEmailDuplicate(data.email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      return;
    }

    setLoading(true);

    try {
      // Supabase auth를 통한 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("회원가입에 실패했습니다.");

      showSuccess("회원가입이 완료되었습니다.", "로그인해주세요.");

      router.push("/login");
    } catch (error: any) {
      devLog.error("Registration failed:", error);
      const errorMessage = getRegistrationErrorMessage(error);
      setEmailError(errorMessage);

      showError("회원가입 실패", errorMessage);
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
              <CardTitle className="text-3xl">
                {AUTH_GUIDE_MESSAGES.SIGNUP_TITLE}
              </CardTitle>
              <CardDescription>
                {AUTH_GUIDE_MESSAGES.SIGNUP_DESCRIPTION}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleRegister)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-800">
                          {AUTH_LABELS.EMAIL}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder={AUTH_PLACEHOLDERS.EMAIL}
                              onBlur={(e) => {
                                field.onBlur();
                                handleEmailBlur();
                              }}
                              autoComplete="username"
                              className={`h-12 pl-10 input-focus ${
                                form.formState.errors.email || emailError
                                  ? "border-red-500"
                                  : ""
                              }`}
                              disabled={loading || isCheckingEmail}
                            />
                          </FormControl>
                          {isCheckingEmail && (
                            <Loading
                              spinnerSize={16}
                              showText={false}
                              minHeight="auto"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                          )}
                        </div>
                        {(form.formState.errors.email || emailError) && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.email?.message || emailError}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-800">
                          {AUTH_LABELS.NAME}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder={AUTH_PLACEHOLDERS.NAME}
                              autoComplete="name"
                              className="h-12 pl-10 input-focus"
                              disabled={loading}
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
                          {AUTH_LABELS.PASSWORD}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder={AUTH_PLACEHOLDERS.PASSWORD}
                              autoComplete="new-password"
                              className="h-12 pl-10 input-focus"
                              disabled={loading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                        <PasswordStrength password={field.value} />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-800">
                          {AUTH_LABELS.CONFIRM_PASSWORD}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder={AUTH_PLACEHOLDERS.CONFIRM_PASSWORD}
                              autoComplete="new-password"
                              className="h-12 pl-10 input-focus"
                              disabled={loading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-800">
                          {AUTH_LABELS.PHONE}{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder={AUTH_PLACEHOLDERS.PHONE}
                              className="h-12 pl-10 input-focus"
                              disabled={loading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-12 w-full"
                    disabled={loading || !!emailError}
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
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                {AUTH_GUIDE_MESSAGES.ALREADY_HAVE_ACCOUNT}{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  {AUTH_GUIDE_MESSAGES.GO_LOGIN}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
