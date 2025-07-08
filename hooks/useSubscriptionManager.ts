import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";

// React Query Hooks
import {
  useVapidKeyQuery,
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useSubscriptionStatusQuery,
} from "@/lib/hooks/query/use-push-mutations";
import { settingsKeys } from "@/lib/hooks/query/query-keys";

export function useSubscriptionManager(enableVapidKey: boolean = false) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // React Query Hooks - VAPID key는 필요할 때만 조회
  const { data: vapidKey } = useVapidKeyQuery({ enabled: enableVapidKey });
  const { data: subscriptions } = useSubscriptionStatusQuery(false); // 수동으로 조회할 때만 사용
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const deleteSubscriptionMutation = useDeleteSubscriptionMutation();

  // 알림 설정을 동적으로 조회하는 함수 (React Query 사용)
  const getUserNotificationSettings = async (userId: string) => {
    try {
      // React Query 캐시에서 먼저 확인
      const cachedData = queryClient.getQueryData(settingsKeys.notifications());
      if (cachedData) {
        return cachedData;
      }

      // 캐시에 없으면 수동으로 fetch
      const data = await queryClient.fetchQuery({
        queryKey: settingsKeys.notifications(),
        queryFn: async () => {
          const response = await apiClient("/api/notifications/settings", {
            method: "GET",
            context: "알림 설정 조회 (구독 관리용)",
          });
          return response;
        },
        staleTime: 1000 * 60 * 5, // 5분간 stale하지 않음
      });

      return data;
    } catch (error) {
      devLog.error("알림 설정 조회 실패:", error);
      return null;
    }
  };

  // VAPID 키 가져오기 (React Query 사용)
  const getVapidKey = async (): Promise<string | null> => {
    try {
      // 이미 캐시된 VAPID 키가 있으면 사용
      if (vapidKey) {
        return vapidKey;
      }

      devLog.warn("VAPID 키가 캐시되지 않음 - 직접 조회 필요");
      return null;
    } catch (error) {
      devLog.error("VAPID 키 조회 실패:", error);
      return null;
    }
  };

  // Base64 to Uint8Array 변환
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // 현재 구독 해제 (브라우저 + 서버) - React Query 사용
  const unsubscribeCurrent = async (): Promise<boolean> => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        devLog.log("브라우저에서 푸시 알림을 지원하지 않습니다.");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        devLog.log("기존 구독 발견:", subscription.endpoint);

        // 1. 브라우저 구독 해제
        await subscription.unsubscribe();
        devLog.log("브라우저 구독 해제 완료");

        // 2. 서버에서 구독 정보 삭제 (React Query Mutation 사용)
        try {
          await deleteSubscriptionMutation.mutateAsync(subscription.endpoint);
          devLog.log("서버 구독 정보 삭제 완료");
        } catch (error) {
          // 에러는 mutation에서 처리됨
          // 브라우저 구독은 해제되었으므로 true 반환
        }

        return true;
      } else {
        devLog.log("삭제할 구독이 없습니다.");
        return false;
      }
    } catch (error) {
      handleError(error, "구독 해제");
      return false;
    }
  };

  // 새 사용자로 구독 전환 - React Query 사용
  const switchSubscription = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        devLog.log(`구독 전환 시작: ${userId}`);

        // 1. 브라우저 지원 확인
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          devLog.warn("브라우저에서 푸시 알림을 지원하지 않습니다.");
          return false;
        }

        // 2. 기존 구독 해제
        await unsubscribeCurrent();

        // 3. 사용자의 알림 설정 확인
        const currentNotificationSettings = await getUserNotificationSettings(
          userId
        );

        // 4. 알림 설정이 비활성화되어 있으면 구독하지 않음
        if (
          !currentNotificationSettings ||
          !currentNotificationSettings.is_active
        ) {
          devLog.log(
            `사용자 ${userId}의 알림 설정이 비활성화되어 있어 구독을 생성하지 않습니다.`
          );
          return true; // 설정상 구독하지 않는 것이므로 성공으로 처리
        }

        // 5. VAPID 키 가져오기 (React Query 사용)
        const currentVapidKey = await getVapidKey();
        if (!currentVapidKey) {
          devLog.warn("VAPID 키를 가져올 수 없습니다.");
          return false;
        }

        // 6. 새 구독 생성
        const registration = await navigator.serviceWorker.ready;
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(currentVapidKey),
        });

        // 7. 서버에 구독 정보 전송 (React Query Mutation 사용)
        await createSubscriptionMutation.mutateAsync({
          subscription: newSubscription.toJSON(),
        });

        devLog.log(`구독 전환 완료: ${userId}`);
        return true;
      } catch (error) {
        devLog.error("구독 전환 실패:", error);
        return false;
      }
    },
    [unsubscribeCurrent, getVapidKey, createSubscriptionMutation]
  );

  // 로그아웃 시 구독 정리
  const cleanupSubscription = useCallback(async (): Promise<boolean> => {
    try {
      devLog.log("구독 정리 시작");

      // 브라우저 및 서버 구독 해제
      const result = await unsubscribeCurrent();
      devLog.log(`구독 정리 결과: ${result}`);

      devLog.log("구독 정리 완료");
      return result;
    } catch (error) {
      handleError(error, "구독 정리");
      return false;
    }
  }, []);

  // 리프레시 토큰 오류 처리
  const handleRefreshTokenError = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      devLog.warn("리프레시 토큰 오류 감지 - 로그인 페이지로 리다이렉트");
      router.push("/login");
    }
  }, [router]);

  // 구독 상태 확인 및 동기화 - React Query 사용
  const checkSubscriptionSync = useCallback(async (): Promise<boolean> => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const browserSubscription =
        await registration.pushManager.getSubscription();

      if (!browserSubscription) {
        return false;
      }

      // 서버 구독 정보 확인 (React Query 사용)
      // subscriptions가 이미 캐시되어 있으면 사용, 없으면 수동으로 fetch
      let currentSubscriptions = subscriptions;

      if (!currentSubscriptions) {
        // 수동으로 구독 상태 조회 (React Query refetch 사용 권장)
        devLog.warn("구독 상태가 캐시되지 않음 - 수동 조회 필요");
        return false;
      }

      const hasValidSubscription = currentSubscriptions?.some(
        (sub: any) => sub.endpoint === browserSubscription.endpoint
      );

      return hasValidSubscription;
    } catch (error) {
      devLog.error("구독 상태 확인 실패:", error);
      return false;
    }
  }, [subscriptions]);

  // 전역 에러 리스너 설정
  const setupErrorListener = useCallback(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes("Invalid Refresh Token") ||
        event.error?.message?.includes("refresh_token_not_found")
      ) {
        handleRefreshTokenError();
      }
    };

    window.addEventListener("error", handleError);

    // 클린업 함수 반환
    return () => window.removeEventListener("error", handleError);
  }, [handleRefreshTokenError]);

  return {
    switchSubscription,
    cleanupSubscription,
    handleRefreshTokenError,
    checkSubscriptionSync,
    setupErrorListener,
    unsubscribeCurrent,
  };
}
