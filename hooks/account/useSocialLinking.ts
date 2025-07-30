import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import type { SocialIdentity } from "@/lib/types/account";

export function useSocialLinking() {
  const [identities, setIdentities] = useState<SocialIdentity[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState<string | null>(null);
  const [unlinkingLoading, setUnlinkingLoading] = useState<string | null>(null);
  const { showSuccess, showError, showInfo } = useCommonToast();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 연결된 계정 목록 조회
  const fetchIdentities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUserIdentities();

      if (error) {
        showError("계정 조회 실패", error.message);
        return;
      }

      setIdentities((data?.identities || []) as SocialIdentity[]);
    } catch (error) {
      devLog.error("연결된 계정 조회 중 오류:", error);
      showError("계정 조회 실패", "연결된 계정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [supabase.auth, showError]);

  // 소셜 계정 연동
  const handleLinkAccount = useCallback(
    async (provider: string) => {
      try {
        setLinkingLoading(provider);
        showInfo("계정 연동 시작", `${provider} 계정을 연동하는 중입니다...`);

        const { error } = await supabase.auth.linkIdentity({
          provider: provider as any,
          options: {
            redirectTo: `${window.location.origin}/api/auth/link-callback?provider=${provider}`,
          },
        });

        if (error) {
          showError("계정 연동 실패", error.message);
          return;
        }
      } catch (error) {
        showError("계정 연동 실패", "계정 연동 중 오류가 발생했습니다.");
      } finally {
        setLinkingLoading(null);
      }
    },
    [supabase.auth, showInfo, showError]
  );

  // 소셜 계정 연동 해제
  const handleUnlinkAccount = useCallback(
    async (identity: SocialIdentity) => {
      try {
        setUnlinkingLoading(identity.id);
        showInfo(
          "계정 연동 해제 시작",
          `${identity.provider} 계정 연동을 해제하는 중입니다...`
        );

        const { error } = await supabase.auth.unlinkIdentity(identity);

        if (error) {
          devLog.error(`${identity.provider} 계정 연동 해제 실패:`, error);
          showError("계정 연동 해제 실패", error.message);
          return;
        }

        showSuccess(
          "계정 연동 해제 완료",
          `${identity.provider} 계정 연동이 해제되었습니다.`
        );
        await fetchIdentities(); // 목록 새로고침
      } catch (error) {
        devLog.error(`${identity.provider} 계정 연동 해제 중 오류:`, error);
        showError(
          "계정 연동 해제 실패",
          "계정 연동 해제 중 오류가 발생했습니다."
        );
      } finally {
        setUnlinkingLoading(null);
      }
    },
    [supabase.auth, showInfo, showError, showSuccess, fetchIdentities]
  );

  // 계정 연동 가능 여부 확인
  const canUnlink = identities.length > 1;

  // URL 파라미터 토스트 메시지 처리
  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const message = searchParams.get("message");
    const provider = searchParams.get("provider");

    // 소셜 연동 관련 파라미터 클린업 유틸리티
    const cleanUpParams = (params: URLSearchParams) => {
      [
        "error",
        "error_code",
        "error_description",
        "message",
        "success",
        "provider",
      ].forEach((key) => params.delete(key));
      return params;
    };

    if (error === "link_failed" && message) {
      const decodedMessage = decodeURIComponent(message);
      const errorResponse = getAuthErrorMessage(decodedMessage);
      showError("소셜 계정 연동 실패", errorResponse.message);
      // URL에서 모든 관련 파라미터 제거
      const params = cleanUpParams(new URLSearchParams(searchParams));
      router.replace(`/admin/account?${params.toString()}`);
    } else if (success === "linked") {
      const providerName =
        provider === "google"
          ? "Google"
          : provider === "kakao"
          ? "Kakao"
          : provider || "소셜";
      showSuccess(
        "소셜 계정 연동 완료",
        `${providerName} 계정이 성공적으로 연동되었습니다.`
      );
      // URL에서 모든 관련 파라미터 제거
      const params = cleanUpParams(new URLSearchParams(searchParams));
      router.replace(`/admin/account?${params.toString()}`);
      // 목록 새로고침
      fetchIdentities();
    }
  }, [searchParams, router, showError, showSuccess, fetchIdentities]);

  return {
    identities,
    loading,
    linkingLoading,
    unlinkingLoading,
    canUnlink,
    fetchIdentities,
    handleLinkAccount,
    handleUnlinkAccount,
  };
}
