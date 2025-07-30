import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { createClient } from "@/lib/supabase/client";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import type { LoginFormData } from "@/lib/utils/validation/auth-validation";

export function useLoginForm() {
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { showInfo, showSuccess, showError } = useCommonToast();
  const { signIn } = useAuthActions();

  // 일반 로그인
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setFormError("");
    showInfo("로그인 시도 중", "잠시만 기다려주세요.");
    try {
      const result = await signIn(data);
      if (result.success) {
        showSuccess("로그인 성공", result.message || "대시보드로 이동합니다.");
        setRedirecting(true);
        router.replace("/admin/dashboard");
        return;
      }
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      setFormError(authError.message);
      showError("로그인 실패", authError.message);
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
      showError(`${provider} 로그인 실패`, "로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return {
    loading,
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
