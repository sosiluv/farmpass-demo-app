import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { createClient } from "@/lib/supabase/client";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
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

  // 세션 체크 완료 시 호출할 함수
  const setSessionChecked = () => {
    setCheckingSession(false);
  };

  // 일반 로그인
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setFormError("");
    setRedirecting(false); // 로그인 시도 시 redirecting 상태 초기화
    showInfo("로그인 시도 중", "잠시만 기다려주세요.");
    try {
      const result = await signIn(data);

      // 서버에서 받은 메시지와 약관 동의 상태 사용
      setRedirecting(true);

      // 서버에서 받은 메시지 표시
      showSuccess("로그인 성공", result.message || "로그인에 성공했습니다.");

      // 약관 동의 상태에 따라 리다이렉트
      if (!result.consent?.hasAllRequiredConsents && !hasConsents()) {
        // 약관 동의가 필요한 경우
        router.replace("/profile-setup");
      } else {
        // 모든 조건이 충족된 경우
        router.replace("/admin/dashboard");
      }
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
