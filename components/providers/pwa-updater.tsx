"use client";

import { useEffect } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";

/**
 * PWA 서비스 워커 업데이트 감지 및 자동 새로고침 컴포넌트
 *
 * 배포 환경에서 새 버전이 배포되었을 때 캐시된 이전 버전으로 인한
 * 무한 로딩 문제를 해결하기 위해 자동으로 새로고침을 수행합니다.
 */
export function PWAUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          // 기존 서비스 워커 등록 확인
          const registration = await navigator.serviceWorker.getRegistration();

          if (registration) {
            devLog.log("[PWA] Service Worker 감지됨, 업데이트 확인 중...");

            // 새 서비스 워커 설치 감지
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              devLog.log("[PWA] 새 Service Worker 설치 감지");

              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // 새 버전이 설치되었고 기존 서비스 워커가 있는 경우
                    devLog.log("[PWA] 새 버전 감지 - 페이지 새로고침 예정");

                    // 즉시 새로고침하지 않고 잠시 후 새로고침 (사용자 경험 고려)
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  }
                });
              }
            });

            // 수동으로 업데이트 확인
            registration.update().catch((error) => {
              devLog.warn("[PWA] Service Worker 업데이트 확인 실패:", error);
            });
          }

          // 서비스 워커 컨트롤러 변경 감지 (활성화 시)
          let refreshing = false;
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
              refreshing = true;
              devLog.log("[PWA] Service Worker 활성화 - 페이지 새로고침");
              window.location.reload();
            }
          });
        } catch (error) {
          devLog.error("[PWA] Service Worker 처리 실패:", error);
        }
      };

      // 페이지 로드 후 즉시 실행
      registerSW();

      // 주기적으로 업데이트 확인 (5분마다)
      const updateCheckInterval = setInterval(async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
          }
        } catch (error) {
          devLog.warn("[PWA] 주기적 업데이트 확인 실패:", error);
        }
      }, 5 * 60 * 1000); // 5분

      return () => {
        clearInterval(updateCheckInterval);
      };
    }
  }, []);

  return null;
}
