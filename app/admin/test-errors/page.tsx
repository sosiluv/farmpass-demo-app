"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminError } from "@/components/error/admin-error";
import { AccessDenied } from "@/components/error/access-denied";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useAuth } from "@/components/providers/auth-provider";
import { ToastPositionSelector } from "@/components/ui/toast-position-selector";
import {
  Bug,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw,
  Home,
  User,
  Settings,
} from "lucide-react";

// 에러를 발생시키는 컴포넌트
function ErrorComponent(): never {
  throw new Error("테스트용 에러입니다!");
}

export default function TestErrorsPage() {
  const [showError, setShowError] = useState<string | null>(null);
  const [shouldCrash, setShouldCrash] = useState(false);
  const toast = useCommonToast();
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const loading = state.status === "loading";

  // 컴포넌트 레벨에서 에러 발생
  if (shouldCrash) {
    throw new Error("컴포넌트 크래시 테스트 - 500 에러 페이지로 이동!");
  }

  const triggerError = (type: string) => {
    toast.showWarning(
      "에러 테스트 시작",
      `${type} 에러를 발생시키는 중입니다...`
    );

    // 에러 발생 전 정보 알림
    toast.showInfo("에러 발생 예정", "3초 후 에러가 발생합니다.");

    setTimeout(() => {
      throw new Error(`테스트 에러: ${type}`);
    }, 3000);
  };

  const resetError = () => {
    // 모든 에러 상태 초기화
    setShowError(null);
    setShouldCrash(false);

    // 브라우저 콘솔 클리어 (선택적)
    if (typeof window !== "undefined") {
      console.clear();
      devLog.log("🧹 테스트 에러 페이지 초기화 완료");
    }

    // 인증 상태 확인 및 리셋 (필요시)
    if (typeof window !== "undefined" && (window as any).checkAuthState) {
      const authState = (window as any).checkAuthState();
      if (authState?.loading) {
        devLog.log("🔧 인증 상태도 함께 리셋합니다...");
        (window as any).resetAuthState?.();
      }
    }

    toast.showCustomSuccess(
      "에러 초기화 완료",
      "모든 테스트 에러 상태가 초기화되었습니다."
    );
  };

  const showToastError = () => {
    toast.showCustomError(
      "토스트 에러 테스트",
      "이것은 토스트 알림으로 표시되는 에러 메시지입니다."
    );
  };

  const triggerPageCrash = () => {
    toast.showCustomError(
      "페이지 크래시 테스트",
      "2초 후 컴포넌트 에러가 발생하여 500 에러 페이지로 이동합니다..."
    );

    // 2초 후 컴포넌트 레벨에서 에러 발생
    setTimeout(() => {
      setShouldCrash(true);
    }, 2000);
  };

  // 관리자 권한 체크
  if (!profile || profile.account_type !== "admin") {
    return (
      <AccessDenied
        title="관리자 전용"
        description="이 페이지는 관리자만 접근할 수 있습니다."
        showNavigation={true}
      />
    );
  }

  // 개발 모드에서만 접근 가능
  if (process.env.NODE_ENV !== "development") {
    return (
      <AccessDenied
        title="개발 모드 전용"
        description="이 페이지는 개발 모드에서만 접근할 수 있습니다."
        showNavigation={true}
      />
    );
  }

  // 추가 안전장치: 브라우저에서도 개발 모드 확인
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
  ) {
    return (
      <AccessDenied
        title="로컬 개발 환경 전용"
        description="이 페이지는 로컬 개발 환경에서만 접근할 수 있습니다."
        showNavigation={true}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 인증 상태 디버깅 카드 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <User className="w-5 h-5" />
            현재 인증 상태 (디버깅 정보)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>로딩 상태:</strong> {loading ? "로딩 중" : "완료"}
            </div>
            <div>
              <strong>프로필:</strong> {profile ? "로그인됨" : "로그인 안됨"}
            </div>
            {profile && (
              <>
                <div>
                  <strong>사용자 ID:</strong> {profile.id}
                </div>
                <div>
                  <strong>이메일:</strong> {profile.email}
                </div>
                <div>
                  <strong>계정 타입:</strong> {profile.account_type}
                </div>
                <div>
                  <strong>이름:</strong> {profile.name || "없음"}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const state = (window as any).checkAuthState?.();
                toast.showCustomSuccess(
                  "인증 상태 확인",
                  `로딩: ${state?.loading}, 프로필: ${
                    state?.profile ? "있음" : "없음"
                  }`
                );
              }}
            >
              상태 확인
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                (window as any).resetAuthState?.();
                toast.showCustomSuccess(
                  "인증 상태 리셋",
                  "인증 상태가 리셋되었습니다."
                );
              }}
            >
              상태 리셋
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const result = await (window as any).refreshSession?.();
                if (result) {
                  toast.showCustomSuccess("세션 새로고침", "성공");
                } else {
                  toast.showCustomError("세션 새로고침", "실패");
                }
              }}
            >
              세션 새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            에러 페이지 테스트 (개발 모드 전용)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              이 페이지는 다양한 에러 상황을 테스트하기 위한 개발용
              페이지입니다. 프로덕션 환경에서는 접근할 수 없습니다.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button
              variant="destructive"
              onClick={() => triggerError("admin-error")}
              className="h-20 flex-col"
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              관리 영역 에러
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerError("access-denied")}
              className="h-20 flex-col border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Shield className="w-6 h-6 mb-2" />
              접근 권한 없음
            </Button>

            <Button
              variant="outline"
              onClick={() => triggerError("error-boundary")}
              className="h-20 flex-col border-red-200 text-red-700 hover:bg-red-50"
            >
              <Zap className="w-6 h-6 mb-2" />
              Error Boundary
            </Button>

            <Button
              variant="outline"
              onClick={showToastError}
              className="h-20 flex-col border-green-200 text-green-700 hover:bg-green-50"
            >
              <Bug className="w-6 h-6 mb-2" />
              토스트 에러
            </Button>

            <Button
              variant="outline"
              onClick={triggerPageCrash}
              className="h-20 flex-col border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Zap className="w-6 h-6 mb-2" />
              페이지 크래시
              <span className="text-xs">(500 에러)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // 404 페이지로 이동
                window.location.href = "/non-existent-page";
              }}
              className="h-20 flex-col border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              404 페이지 테스트
            </Button>

            <Button
              variant="secondary"
              onClick={resetError}
              className="h-20 flex-col"
            >
              <RefreshCw className="w-6 h-6 mb-2" />
              에러 초기화
            </Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/dashboard")}
              className="h-20 flex-col border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Home className="w-6 h-6 mb-2" />
              대시보드로
            </Button>
          </div>

          {/* 에러 표시 영역 */}
          {showError === "admin-error" && (
            <AdminError
              error={new Error("테스트용 관리 영역 에러입니다.")}
              reset={resetError}
              title="테스트 에러"
              description="이것은 관리 영역 에러 컴포넌트 테스트입니다."
            />
          )}

          {showError === "access-denied" && (
            <AccessDenied
              title="테스트 접근 거부"
              description="이것은 접근 권한 에러 컴포넌트 테스트입니다."
              requiredRole="관리자"
              currentRole="일반 사용자"
            />
          )}

          {showError === "error-boundary" && (
            <ErrorBoundary
              title="Error Boundary 테스트"
              description="이것은 Error Boundary 컴포넌트 테스트입니다."
            >
              <ErrorComponent />
            </ErrorBoundary>
          )}
        </CardContent>
      </Card>

      {/* 토스트 위치 설정 */}
      <ToastPositionSelector showPreview={true} />

      {/* 에러 페이지 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            구현된 에러 페이지 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">전체 페이지 에러</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <code>app/not-found.tsx</code> - 404 Not Found
                </li>
                <li>
                  • <code>app/error.tsx</code> - 500 Server Error
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">컴포넌트 레벨 에러</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <code>app/admin/error.tsx</code> - 관리 영역 에러
                </li>
                <li>
                  • <code>components/error/admin-error.tsx</code> - 관리 에러
                  컴포넌트
                </li>
                <li>
                  • <code>components/error/access-denied.tsx</code> - 접근 권한
                  에러
                </li>
                <li>
                  • <code>components/error/error-boundary.tsx</code> - Error
                  Boundary
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">테스트 버튼 설명</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>관리 영역 에러</strong>: 컴포넌트 레벨 에러
                  (사이드바 유지)
                </li>
                <li>
                  • <strong>접근 권한 없음</strong>: 권한 부족 에러 컴포넌트
                </li>
                <li>
                  • <strong>Error Boundary</strong>: React 에러 바운더리 테스트
                </li>
                <li>
                  • <strong>토스트 에러</strong>: 토스트 알림으로 에러 메시지
                  표시
                </li>
                <li>
                  • <strong>페이지 크래시</strong>: 컴포넌트 에러 발생으로 500
                  에러 페이지 이동
                </li>
                <li>
                  • <strong>404 페이지 테스트</strong>: 존재하지 않는 페이지로
                  이동
                </li>
                <li>
                  • <strong>에러 초기화</strong>: 모든 테스트 에러 상태 + 콘솔 +
                  인증 상태 초기화
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
