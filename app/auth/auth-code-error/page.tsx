"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">인증 오류가 발생했습니다</h1>
        <p className="text-gray-700 mb-6 text-center">
          소셜 로그인 또는 인증 코드 처리 중 문제가 발생했습니다.
          <br />
          다시 시도하거나, 문제가 계속되면 관리자에게 문의해 주세요.
        </p>
        <div className="flex gap-2 w-full">
          <Button asChild className="w-full">
            <Link href="/auth/login">로그인 페이지로 이동</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
