import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface SocialIdentity {
  id: string;
  user_id: string;
  identity_id: string;
  provider: string;
  identity_data:
    | {
        email?: string;
        name?: string;
        avatar_url?: string;
      }
    | undefined;
  created_at: string;
  last_sign_in_at: string;
}

export function useSocialLinking() {
  const [identities, setIdentities] = useState<SocialIdentity[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState<string | null>(null);
  const [unlinkingLoading, setUnlinkingLoading] = useState<string | null>(null);
  const { showSuccess, showError, showInfo } = useCommonToast();
  const supabase = createClient();

  // 연결된 계정 목록 조회
  const fetchIdentities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getUserIdentities();

      if (error) {
        devLog.error("연결된 계정 조회 실패:", error);
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

        const { data, error } = await supabase.auth.linkIdentity({
          provider: provider as any,
          options: {
            redirectTo: `${window.location.origin}/api/auth/link-callback`,
          },
        });

        if (error) {
          devLog.error(`${provider} 계정 연동 실패:`, error);
          showError("계정 연동 실패", error.message);
          return;
        }

        showSuccess(
          "계정 연동 완료",
          `${provider} 계정이 성공적으로 연동되었습니다.`
        );
        await fetchIdentities(); // 목록 새로고침
      } catch (error) {
        devLog.error(`${provider} 계정 연동 중 오류:`, error);
        showError("계정 연동 실패", "계정 연동 중 오류가 발생했습니다.");
      } finally {
        setLinkingLoading(null);
      }
    },
    [supabase.auth, showInfo, showError, showSuccess, fetchIdentities]
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

        const { data, error } = await supabase.auth.unlinkIdentity(identity);

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
