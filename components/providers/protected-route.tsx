"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUTTONS } from "@/lib/constants/common";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { PageLoading } from "@/components/ui/loading";
import { useAuthActions } from "@/hooks/auth/useAuthActions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { signOut } = useAuthActions();

  // 로그아웃 처리 중복 방지를 위한 ref
  const isLoggingOut = useRef(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // 인증되지 않은 경우 로그아웃 처리 후 리다이렉트
    if (
      state.status === "unauthenticated" &&
      !isLoggingOut.current &&
      !hasRedirected.current
    ) {
      const handleUnauthenticated = async () => {
        if (isLoggingOut.current) return; // 이미 처리 중이면 스킵

        isLoggingOut.current = true;
        try {
          await signOut(); // 클라이언트 상태 정리
        } catch (error) {
          console.error("로그아웃 처리 중 오류:", error);
        } finally {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.push(redirectTo);
          }
        }
      };

      handleUnauthenticated();
      return;
    }

    // 관리자 권한이 필요한데 권한이 없는 경우
    if (
      requireAdmin &&
      state.status === "authenticated" &&
      (!profile || profile.account_type !== "admin") &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      router.push("/unauthorized");
      return;
    }
  }, [state.status, requireAdmin, redirectTo, router, profile, signOut]);

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
      <>
        <PageLoading
          text={loadingText}
          subText={
            loadingTimeout ? "새로고침을 시도해보세요" : "잠시만 기다려주세요"
          }
          variant="lottie"
        />
        {loadingTimeout && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
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
      </>
    );
  }

  // 인증되지 않은 경우 (리다이렉트 처리됨)
  if (state.status === "unauthenticated") {
    return (
      <>
        {/* 로그인 페이지로 이동 중 로딩 UI */}
        <PageLoading text="로그인 페이지를 불러오는 중..." variant="lottie" />
      </>
    );
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
