"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUTTONS } from "@/lib/constants/common";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // 인증되지 않은 경우 리다이렉트
    if (state.status === "unauthenticated") {
      router.push(redirectTo);
      return;
    }

    // 관리자 권한이 필요한데 권한이 없는 경우
    if (
      requireAdmin &&
      state.status === "authenticated" &&
      (!profile || profile.account_type !== "admin")
    ) {
      router.push("/unauthorized");
      return;
    }
  }, [state.status, requireAdmin, redirectTo, router, profile]);

  // 로딩 타임아웃 처리 (10초)
  useEffect(() => {
    if (state.status === "loading" || state.status === "initializing") {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [state.status]);

  // 앱 초기화 중이거나 로딩 중일 때
  if (state.status === "initializing" || state.status === "loading") {
    let loadingText = "페이지를 불러오는 중...";

    if (loadingTimeout) {
      loadingText = "로딩이 지연되고 있습니다. 네트워크 상태를 확인해주세요.";
    } else if (state.status === "initializing") {
      loadingText = "시스템을 초기화하는 중...";
    } else if (state.status === "loading") {
      loadingText = "인증 정보를 확인하는 중...";
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <p className="text-sm text-gray-600">{loadingText}</p>
          {loadingTimeout && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {BUTTONS.REFRESH_BUTTON}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-red-600">인증 중 오류가 발생했습니다</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {BUTTONS.REFRESH_BUTTON}
          </Button>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 (리다이렉트 처리됨)
  if (state.status === "unauthenticated") {
    return null;
  }

  // 권한 부족 (리다이렉트 처리됨)
  if (
    requireAdmin &&
    state.status === "authenticated" &&
    (!profile || profile.account_type !== "admin")
  ) {
    return null;
  }

  // 인증된 경우 children 렌더링
  return <>{children}</>;
}
