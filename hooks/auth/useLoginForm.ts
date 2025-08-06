import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { createClient } from "@/lib/supabase/client";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useUserConsentsQuery } from "@/lib/hooks/query/use-user-consents-query";
import { useRegistrationStore } from "@/store/use-registration-store";
import type { LoginFormData } from "@/lib/utils/validation/auth-validation";

export function useLoginForm() {
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); // 세션 체크 중 상태
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();
  const { signIn } = useAuthActions();

  // Zustand store 사용
  const { hasConsents } = useRegistrationStore();

  // 최상단에서 훅 선언
  const { refetch: refetchConsents } = useUserConsentsQuery();

  // 세션 체크 완료 시 호출할 함수
  const setSessionChecked = () => {
    setCheckingSession(false);
  };

  // 약관 동의 상태 및 프로필 완성도 확인 후 리다이렉트
  const checkTermsConsentAndRedirect = async () => {
    try {
      // 약관 동의 상태 확인
      const { data: consentData } = await refetchConsents();

      if (!consentData?.hasAllRequiredConsents && !hasConsents()) {
        router.replace("/profile-setup");
        return;
      }
      // 모든 조건이 충족된 경우 대시보드로 이동
      router.replace("/admin/dashboard");
    } catch (error) {
      console.error("사용자 상태 확인 실패:", error);
      router.replace("/auth/login");
    }
  };

  // 일반 로그인
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setFormError("");
    setRedirecting(false); // 로그인 시도 시 redirecting 상태 초기화
    showInfo("로그인 시도 중", "잠시만 기다려주세요.");
    try {
      const result = await signIn(data);
      showSuccess(
        "로그인 성공",
        result.message || "약관 동의 상태를 확인합니다."
      );

      // 로그인 성공 시 약관 동의 상태 확인 후 리다이렉트
      setRedirecting(true);
      await checkTermsConsentAndRedirect();
    } catch (error) {
      // useSignIn에서 이미 한글 메시지로 throw한 Error 객체
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setFormError(errorMessage);
      showError("로그인 실패", errorMessage);
      setRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  // 소셜 로그인
  const handleSocialLogin = async (
    provider: "kakao" | "google",
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const oauthOptions = {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { prompt: "select_account" },
      };
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });
      if (error) {
        showError(`${provider} 로그인 실패`, error.message);
        setLoading(false);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError(`${provider} 로그인 실패`, errorMessage);
      setLoading(false);
    }
  };

  return {
    loading,
    checkingSession,
    setSessionChecked,
    kakaoLoading,
    setKakaoLoading,
    googleLoading,
    setGoogleLoading,
    formError,
    setFormError,
    redirecting,
    setRedirecting,
    handleLogin,
    handleSocialLogin,
  };
}
