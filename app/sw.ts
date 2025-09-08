import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: defaultCache,

  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          // 네트워크 실패 시에만 오프라인 페이지 제공
          // 캐시에 있는 페이지는 정상적으로 제공
          return (
            request.destination === "document" &&
            !request.url.includes("/offline")
          );
        },
      },
    ],
  },
});

// 푸시 알림 이벤트 리스너 (강화된 버전)
self.addEventListener("push", (event) => {
  console.log("[SW] 푸시 메시지 수신:", event);

  let notificationData = {
    title: "FarmPass",
    body: "새로운 알림이 도착했습니다.",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    tag: "farmpass-notification",
    requireInteraction: false,
    data: {
      url: "/admin/dashboard",
      timestamp: Date.now(),
    },
  };

  // 푸시 데이터가 있는 경우 파싱
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log("[SW] 파싱된 푸시 데이터:", pushData);

      // 데이터 유효성 검증
      if (pushData && typeof pushData === "object") {
        notificationData = {
          ...notificationData,
          ...pushData,
          data: {
            ...notificationData.data,
            ...pushData.data,
          },
        };
      } else {
        console.warn("[SW] 유효하지 않은 푸시 데이터 형식:", pushData);
      }
    } catch (error) {
      console.error("[SW] 푸시 데이터 파싱 오류:", error);

      // 텍스트 데이터인 경우
      try {
        const textData = event.data.text();
        if (textData) {
          notificationData.body = textData;
          console.log("[SW] 텍스트 데이터로 설정:", textData);
        }
      } catch (textError) {
        console.error("[SW] 텍스트 데이터 파싱도 실패:", textError);
      }
    }
  }

  console.log("[SW] 최종 알림 데이터:", notificationData);

  // 알림 표시 (오류 처리 강화)
  const promiseChain = self.registration
    .showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      silent: false,
    })
    .then(() => {
      console.log("[SW] 알림 표시 성공");
    })
    .catch((error) => {
      console.error("[SW] 알림 표시 실패:", error);
      // 알림 표시 실패 시에도 이벤트를 완료 처리
    });

  event.waitUntil(promiseChain);
});

// 알림 클릭 이벤트 리스너 (강화된 버전)
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] 알림 클릭됨:", event);

  const notification = event.notification;
  const action = event.action;

  // 알림 닫기
  notification.close();

  // 액션별 처리
  if (action === "dismiss") {
    // 닫기 액션 - 아무것도 하지 않음
    return;
  }

  // 기본 클릭 또는 '확인하기' 액션
  const urlToOpen = notification.data?.url || "/admin/dashboard";

  // 클라이언트 창 열기 또는 포커스
  const promiseChain = self.clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((clientList: readonly Client[]) => {
      // 이미 열린 창이 있는지 확인
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);

        if (clientUrl.origin === targetUrl.origin) {
          // 기존 창 포커스하고 해당 페이지로 이동
          return (client as WindowClient).focus().then(() => {
            return (client as WindowClient).navigate(urlToOpen);
          });
        }
      }

      // 새 창 열기
      return self.clients.openWindow(urlToOpen);
    });

  event.waitUntil(promiseChain);
});

// 알림 닫기 이벤트 리스너
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] 알림 닫힘:", event);

  // 알림 닫기 통계나 로깅
  const notificationData = event.notification.data;
  if (notificationData?.analytics) {
    // 분석 데이터 전송
    console.log("[SW] 알림 닫기 분석:", notificationData);
  }
});

serwist.addEventListeners();
