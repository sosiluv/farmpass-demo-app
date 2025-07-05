import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/api-client";
import { handleError } from "@/lib/utils/handleError";

export function useSubscriptionManager() {
  const router = useRouter();

  // VAPID 키 가져오기
  const getVapidKey = async (): Promise<string | null> => {
    try {
      const data = await apiClient("/api/push/vapid", {
        method: "GET",
        context: "VAPID 키 조회",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return data.publicKey;
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
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

  // 현재 구독 해제 (브라우저 + 서버)
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

        // 2. 서버에서 구독 정보 삭제
        try {
          await apiClient("/api/push/subscription", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
            context: "구독 정보 삭제",
            onError: (error, context) => {
              handleError(error, context);
            },
          });
          devLog.log("서버 구독 정보 삭제 완료");
        } catch (error) {
          // 에러는 이미 onError에서 처리됨
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

  // 새 사용자로 구독 전환
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
        const notificationSettings = await getUserNotificationSettings(userId);

        // 4. 알림 설정이 비활성화되어 있으면 구독하지 않음
        if (!notificationSettings || !notificationSettings.is_active) {
          devLog.log(
            `사용자 ${userId}의 알림 설정이 비활성화되어 있어 구독을 생성하지 않습니다.`
          );
          return false;
        }

        // 5. VAPID 키 가져오기
        const vapidKey = await getVapidKey();
        if (!vapidKey) {
          devLog.warn("VAPID 키를 가져올 수 없습니다.");
          return false;
        }

        // 6. 새 구독 생성
        const registration = await navigator.serviceWorker.ready;
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // 7. 서버에 구독 정보 전송
        await apiClient("/api/push/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: newSubscription.toJSON() }),
          context: "구독 정보 서버 전송",
          onError: (error, context) => {
            handleError(error, context);
          },
        });

        devLog.log(`구독 전환 완료: ${userId}`);
        return true;
      } catch (error) {
        // 에러는 이미 onError에서 처리됨
        return false;
      }
    },
    []
  );

  // 사용자의 알림 설정 조회
  const getUserNotificationSettings = async (userId: string) => {
    try {
      const data = await apiClient("/api/notifications/settings", {
        method: "GET",
        context: "알림 설정 조회",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return data;
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
      return null;
    }
  };

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

  // 구독 상태 확인 및 동기화
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

      // 서버 구독 정보 확인
      const { subscriptions } = await apiClient("/api/push/subscription", {
        method: "GET",
        context: "구독 상태 확인",
        onError: (error, context) => {
          devLog.error("구독 상태 확인 실패:", error);
        },
      });

      const hasValidSubscription = subscriptions?.some(
        (sub: any) => sub.endpoint === browserSubscription.endpoint
      );

      return hasValidSubscription;
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
      return false;
    }
  }, []);

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
