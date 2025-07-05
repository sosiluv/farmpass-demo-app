"use client";

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
import { Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { Logo } from "@/components/common";
import { Loading } from "@/components/ui/loading";
import { apiClient } from "@/lib/utils/api-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useCommonToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiClient("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        context: "비밀번호 재설정 요청",
        onError: (error, context) => {
          devLog.error("Password reset error:", error);
          toast.showCustomError("오류", error.message);
        },
      });

      toast.showCustomSuccess(
        "이메일 전송 완료",
        "비밀번호 재설정 링크가 이메일로 전송되었습니다."
      );

      // 로그인 페이지로 리다이렉트
      router.push("/login");
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
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
            <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
            <CardDescription>
              가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-12 pl-10 input-focus"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="h-12 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loading
                      spinnerSize={16}
                      showText={false}
                      minHeight="auto"
                      className="mr-2"
                    />
                    처리 중...
                  </>
                ) : (
                  "비밀번호 재설정 링크 받기"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <div className="mt-2 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                로그인으로 돌아가기
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
