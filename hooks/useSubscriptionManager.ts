import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createAuthLog } from "@/lib/utils/logging/system-log";

export function useSubscriptionManager() {
  const router = useRouter();

  // VAPID 키 가져오기
  const getVapidKey = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/push/vapid");
      if (!response.ok) throw new Error("VAPID 키 조회 실패");
      const data = await response.json();
      return data.publicKey;
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
          const response = await fetch("/api/push/subscription", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });

          if (response.ok) {
            devLog.log("서버 구독 정보 삭제 완료");
          } else {
            const errorData = await response.json();
            devLog.warn("서버 구독 정보 삭제 실패:", errorData);
          }
        } catch (error) {
          devLog.warn("서버 구독 정보 삭제 실패:", error);
          // 브라우저 구독은 해제되었으므로 true 반환
        }

        return true;
      } else {
        devLog.log("삭제할 구독이 없습니다.");
        return false;
      }
    } catch (error) {
      devLog.error("구독 해제 실패:", error);
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
        const response = await fetch("/api/push/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: newSubscription.toJSON() }),
        });

        if (!response.ok) {
          throw new Error("구독 정보 서버 전송 실패");
        }

        // 8. 구독 전환 성공 로그
        await createAuthLog(
          "SUBSCRIPTION_SWITCHED",
          `구독 전환 완료: ${userId}`,
          undefined,
          userId,
          {
            endpoint: newSubscription.endpoint,
            timestamp: new Date().toISOString(),
            action_type: "subscription_management",
          }
        ).catch(() => {
          // 로그 실패는 무시
        });

        devLog.log(`구독 전환 완료: ${userId}`);
        return true;
      } catch (error) {
        devLog.error("구독 전환 실패:", error);

        // 구독 전환 실패 로그
        await createAuthLog(
          "SUBSCRIPTION_SWITCH_FAILED",
          `구독 전환 실패: ${userId}`,
          undefined,
          userId,
          {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            action_type: "subscription_management",
          }
        ).catch(() => {
          // 로그 실패는 무시
        });

        return false;
      }
    },
    []
  );

  // 사용자의 알림 설정 조회
  const getUserNotificationSettings = async (userId: string) => {
    try {
      const response = await fetch("/api/notifications/settings");
      if (!response.ok) {
        devLog.warn("알림 설정 조회 실패");
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      devLog.error("알림 설정 조회 중 오류:", error);
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
      devLog.error("구독 정리 실패:", error);
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
      const response = await fetch("/api/push/subscription");
      if (!response.ok) {
        return false;
      }

      const { subscriptions } = await response.json();
      const hasValidSubscription = subscriptions?.some(
        (sub: any) => sub.endpoint === browserSubscription.endpoint
      );

      return hasValidSubscription;
    } catch (error) {
      devLog.error("구독 동기화 확인 실패:", error);
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
