"use client";

import { useEffect } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";

/**
 * Service Worker 모니터링 설정 (중복 코드 방지)
 */
const setupServiceWorkerMonitoring = (
  registration: ServiceWorkerRegistration
) => {
  // 개발 환경에서는 업데이트 감지 비활성화 (Hot Reload 충돌 방지)
  // 단, TEST_PWA=true 환경변수가 설정된 경우에는 활성화
  // if (process.env.NODE_ENV === "development") {
  //   devLog.log(
  //     "[SW] 개발 환경 - 업데이트 감지 비활성화 (Hot Reload 충돌 방지)"
  //   );
  //   return;
  // }

  // Service Worker 상태 모니터링
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (newWorker) {
      devLog.log("[SW] 새 Service Worker 설치 중...");

      newWorker.addEventListener("statechange", () => {
        devLog.log("[SW] Service Worker 상태:", newWorker.state);

        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          devLog.log("[SW] 새 버전 감지 - 자동 새로고침 실행");

          // 부드러운 사용자 경험을 위해 잠시 후 자동 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    }
  });

  // Service Worker 활성화 상태 확인
  if (registration.active) {
    devLog.log("[SW] Service Worker 활성화됨");
  }

  // 주기적 업데이트 확인 (5분마다)
  setInterval(() => {
    devLog.log("[SW] 업데이트 확인 중...");
    registration.update();
  }, 5 * 60 * 1000);
};

/**
 * 커스텀 Service Worker 등록 및 관리 컴포넌트
 *
 * next-pwa 없이 순수 Service Worker를 사용하여 푸시 알림 기능을 제공합니다.
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 개발 환경에서는 Service Worker 등록 건너뛰기 (Hot Reload 충돌 방지)
      // 단, TEST_PWA=true 환경변수가 설정된 경우에는 등록
      // if (process.env.NODE_ENV === "development") {
      //   devLog.log(
      //     "[SW] 개발 환경 - Service Worker 등록 건너뛰기 (Hot Reload 충돌 방지)"
      //   );
      //   return;
      // }

      devLog.log("[SW] Service Worker 등록 시작");

      const registerServiceWorker = async () => {
        try {
          // 현재 등록된 Service Worker 확인
          const currentRegistration =
            await navigator.serviceWorker.getRegistration("/");

          if (currentRegistration) {
            const swUrl = currentRegistration.active?.scriptURL;
            devLog.log("[SW] 현재 등록된 Service Worker:", swUrl);

            // push-sw.js가 이미 등록되어 있으면 재사용
            if (swUrl && swUrl.endsWith("/push-sw.js")) {
              devLog.log("[SW] push-sw.js가 이미 등록되어 있음, 재사용");

              // 업데이트 확인만 수행
              currentRegistration.update();

              // 기존 등록을 그대로 사용
              const registration = currentRegistration;

              // 기존 Service Worker에 모니터링 설정
              setupServiceWorkerMonitoring(registration);

              return; // 조기 반환으로 새 등록 건너뛰기
            } else {
              // 다른 Service Worker가 등록되어 있으면 제거 (next-pwa 잔여물)
              devLog.log(
                "[SW] 다른 Service Worker 감지, 제거 후 재등록:",
                swUrl
              );
              await currentRegistration.unregister();
            }
          }

          // 새로운 push-sw.js 등록 (최초 등록 또는 다른 SW 제거 후)
          devLog.log("[SW] push-sw.js 새로 등록 중...");
          const registration = await navigator.serviceWorker.register(
            "/push-sw.js",
            {
              scope: "/",
              updateViaCache: "none", // 항상 최신 버전 확인
            }
          );

          devLog.log("[SW] push-sw.js 등록 성공:", registration.scope);

          // 공통 Service Worker 모니터링 설정
          setupServiceWorkerMonitoring(registration);
        } catch (error) {
          devLog.error("[SW] Service Worker 등록 실패:", error);
        }
      };

      // Service Worker 등록 실행
      registerServiceWorker();

      // 페이지 포커스 시 업데이트 확인
      const handleFocus = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      };

      // 온라인 상태 복구 시 처리
      const handleOnline = () => {
        devLog.log("[SW] 네트워크 연결 복구됨");

        // 잠시 후 Service Worker 업데이트 확인
        setTimeout(() => {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              registration.update();
            }
          });
        }, 2000);
      };

      // 오프라인 상태 감지
      const handleOffline = () => {
        devLog.log("[SW] 네트워크 연결 끊어짐");
      };

      window.addEventListener("focus", handleFocus);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    } else {
      devLog.warn("[SW] Service Worker를 지원하지 않는 브라우저입니다.");
    }
  }, []);

  return null;
}
