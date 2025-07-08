/**
 * 푸시 알림 관련 React Query Mutations
 * VAPID 키, 구독 관리 등
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";

// VAPID 키 조회 (Query)
export const useVapidKeyQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["vapid-key"],
    queryFn: async () => {
      devLog.log("[QUERY] VAPID 키 조회 시작");

      const data = await apiClient("/api/push/vapid", {
        method: "GET",
        context: "VAPID 키 조회",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      return data.publicKey;
    },
    staleTime: 5 * 60 * 1000, // 5분간 fresh 유지
    retry: 2,
    enabled: options?.enabled ?? true, // 기본값은 true
  });
};

// 구독 상태 조회 (Query)
export const useSubscriptionStatusQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      devLog.log("[QUERY] 구독 상태 조회 시작");

      const data = await apiClient("/api/push/subscription", {
        method: "GET",
        context: "구독 상태 조회",
        onError: (error, context) => {
          devLog.error("구독 상태 조회 실패:", error);
        },
      });

      return data.subscriptions || [];
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2분간 fresh 유지
    retry: 1,
  });
};

// 구독 생성/업데이트 (Mutation)
export const useCreateSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscription,
      farmId,
    }: {
      subscription: PushSubscriptionJSON;
      farmId?: string;
    }) => {
      devLog.log("[MUTATION] 푸시 알림 구독 생성 시작", { farmId });

      const result = await apiClient("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, farmId }),
        context: "구독 정보 서버 전송",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[MUTATION] 푸시 알림 구독 생성 완료");
      return result;
    },
    onSuccess: () => {
      // 구독 상태 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      devLog.log("[MUTATION] 구독 상태 캐시 무효화 완료");
    },
    onError: (error) => {
      devLog.error("[MUTATION] 구독 생성 실패:", error);
    },
  });
};

// 구독 삭제 (Mutation)
export const useDeleteSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (endpoint: string) => {
      devLog.log("[MUTATION] 구독 삭제 시작", { endpoint });

      const result = await apiClient("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
        context: "구독 정보 삭제",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[MUTATION] 구독 삭제 완료");
      return result;
    },
    onSuccess: () => {
      // 구독 상태 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      devLog.log("[MUTATION] 구독 상태 캐시 무효화 완료");
    },
    onError: (error) => {
      devLog.error("[MUTATION] 구독 삭제 실패:", error);
    },
  });
};

// 테스트 푸시 전송 (Mutation)
export const useSendTestPushMutation = () => {
  return useMutation({
    mutationFn: async (data: {
      title: string;
      body: string;
      farmId?: string;
    }) => {
      devLog.log("[MUTATION] 테스트 푸시 전송 시작", data);

      const result = await apiClient("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        context: "테스트 푸시 전송",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[MUTATION] 테스트 푸시 전송 완료");
      return result;
    },
    onError: (error) => {
      devLog.error("[MUTATION] 테스트 푸시 전송 실패:", error);
    },
  });
};

// VAPID 키 재생성 (Mutation)
export const useRegenerateVapidKeyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      devLog.log("[MUTATION] VAPID 키 재생성 시작");

      const result = await apiClient("/api/push/vapid", {
        method: "POST",
        context: "VAPID 키 재생성",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      devLog.log("[MUTATION] VAPID 키 재생성 완료");
      return result;
    },
    onSuccess: () => {
      // VAPID 키 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["vapid-key"] });
      // 구독 상태도 무효화 (새 키로 재구독 필요)
      queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
      devLog.log("[MUTATION] VAPID 키 캐시 무효화 완료");
    },
    onError: (error) => {
      devLog.error("[MUTATION] VAPID 키 재생성 실패:", error);
    },
  });
};
