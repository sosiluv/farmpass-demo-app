"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AccessDenied } from "@/components/error/access-denied";

export default function ErrorTestPage() {
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  if (showError) {
    // 500 에러 테스트 (Next.js App Router의 error.tsx)
    throw new Error("강제 500 에러 테스트");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold mb-4">에러 페이지 테스트</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button variant="destructive" onClick={() => setShowError(true)}>
          500 에러(글로벌 에러) 테스트
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/404-not-exist-page")}
        >
          404 에러(존재하지 않는 페이지 이동)
        </Button>
        <Button variant="secondary" onClick={() => setShowAccessDenied(true)}>
          권한 없음(AccessDenied) 테스트
        </Button>
      </div>
      {showAccessDenied && (
        <div className="mt-8 w-full max-w-lg">
          <AccessDenied
            requiredRole="admin"
            currentRole="viewer"
            showNavigation={true}
          />
        </div>
      )}
    </div>
  );
}
