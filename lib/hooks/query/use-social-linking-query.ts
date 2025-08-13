import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { socialLinkingKeys } from "./query-keys";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";

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

const supabase = createClient();

/**
 * 소셜 계정 연동 관련 쿼리 훅
 */
export function useSocialLinkingQuery() {
  const queryClient = useQueryClient();

  // 연결된 계정 목록 조회
  const {
    data: identities = [],
    isLoading,
    error,
    refetch: refetchIdentities,
  } = useQuery({
    queryKey: socialLinkingKeys.identities(),
    queryFn: async (): Promise<SocialIdentity[]> => {
      const { data, error } = await supabase.auth.getUserIdentities();

      if (error) {
        const errorCode = mapRawErrorToCode(error, "auth");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }

      return (data?.identities || []) as SocialIdentity[];
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // 소셜 계정 연동
  const linkMutation = useMutation({
    mutationFn: async (provider: string) => {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/api/auth/link-callback?provider=${provider}`,
        },
      });

      if (error) {
        const errorCode = mapRawErrorToCode(error, "auth");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }
    },
  });

  // 소셜 계정 연동 해제
  const unlinkMutation = useMutation({
    mutationFn: async (identity: SocialIdentity) => {
      const { error } = await supabase.auth.unlinkIdentity(identity);

      if (error) {
        devLog.error(`${identity.provider} 계정 연동 해제 실패:`, error);
        const errorCode = mapRawErrorToCode(error, "auth");
        const message = getErrorMessage(errorCode);
        throw new Error(message);
      }
    },
    onSuccess: (_, identity) => {
      // 계정 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: socialLinkingKeys.identities(),
      });
    },
  });

  // 계정 연동 가능 여부 확인
  const canUnlink = identities.length > 1;

  return {
    // 데이터
    identities,
    canUnlink,

    // 로딩 상태
    isLoading,
    isLinking: linkMutation.isPending,
    isUnlinking: unlinkMutation.isPending,

    // 에러 상태
    error,
    linkError: linkMutation.error,
    unlinkError: unlinkMutation.error,

    // 액션
    linkAccount: linkMutation.mutate,
    unlinkAccount: unlinkMutation.mutate,
    refetchIdentities,
  };
}
