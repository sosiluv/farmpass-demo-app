"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { Logo } from "@/components/common/logo";
import { apiClient } from "@/lib/utils/data";
import { resetPasswordRequestFormSchema } from "@/lib/utils/validation/auth-validation";
import type { ResetPasswordRequestFormData } from "@/lib/utils/validation/auth-validation";
import { handleError } from "@/lib/utils/error";
import { BUTTONS, PAGE_HEADER } from "@/lib/constants/auth";
import { EmailField, AuthButton } from "@/components/auth";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useCommonToast();

  const form = useForm<ResetPasswordRequestFormData>({
    resolver: zodResolver(resetPasswordRequestFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (data: ResetPasswordRequestFormData) => {
    setLoading(true);

    try {
      const result = await apiClient("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
        context: "비밀번호 재설정 요청",
      });

      showSuccess(
        "이메일 전송 완료",
        result.message || "비밀번호 재설정 링크가 이메일로 전송되었습니다."
      );

      // 로그인 페이지로 리다이렉트
      router.push("/auth/login");
    } catch (error) {
      handleError(error, { context: "reset-password-request" });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("오류", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <CardTitle className="text-2xl">
              {PAGE_HEADER.RESET_PASSWORD_TITLE}
            </CardTitle>
            <CardDescription>
              {PAGE_HEADER.RESET_PASSWORD_DESCRIPTION}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <EmailField
                      field={field}
                      loading={loading}
                      autoComplete="username"
                      showFormMessage={true}
                    />
                  )}
                />

                <AuthButton
                  type="reset-password"
                  loading={loading}
                  className="h-12 w-full flex items-center justify-center"
                />
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:underline">
                {BUTTONS.BACK_TO_LOGIN}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
