"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { userConsentsKeys } from "@/lib/hooks/query/query-keys";

/**
 * 사용자 동의 상태 확인 훅
 */
export function useUserConsentsQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: userConsentsKeys.check(),
    queryFn: async () => {
      const response = await apiClient("/api/user-consents/check", {
        method: "GET",
        context: "사용자 동의 상태 확인",
      });

      return response;
    },
    staleTime: 5 * 60 * 1000, // 5분
    enabled,
  });
}

/**
 * 사용자 동의 업데이트 뮤테이션 훅
 */
export function useUpdateUserConsentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      privacyConsent: boolean;
      termsConsent: boolean;
      marketingConsent?: boolean;
    }): Promise<{ consents: any[]; message: string }> => {
      const response = await apiClient("/api/user-consents/update", {
        method: "POST",
        body: JSON.stringify(data),
        context: "사용자 동의 업데이트",
      });

      return { consents: response.consents, message: response.message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userConsentsKeys.check(),
      });
    },
  });
}
