// 푸시 알림 전용 Service Worker
console.log("[Push SW] Service Worker 로드됨");

// Service Worker 설치
self.addEventListener("install", (event) => {
  console.log("[Push SW] Service Worker 설치됨");

  // 필수 파일들을 미리 캐시
  event.waitUntil(
    caches.open("essential-cache-v2").then((cache) => {
      return cache.addAll([
        "/offline",
        "/",
        "/manifest.json",
        "/icon-192x192.png",
        "/icon-512x512.png",
      ]);
    })
  );

  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  console.log("[Push SW] Service Worker 활성화됨");

  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // 오래된 캐시 정리
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 현재 버전이 아닌 캐시 삭제
            if (!cacheName.includes("essential-cache-v2")) {
              console.log("[Push SW] 오래된 캐시 삭제:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

// 푸시 메시지 수신
self.addEventListener("push", (event) => {
  console.log("[Push SW] 푸시 메시지 수신:", event);

  let notificationData = {
    title: "농장 알림",
    body: "새로운 알림이 도착했습니다.",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: "farm-notification",
    requireInteraction: false,
    actions: [
      {
        action: "view",
        title: "확인하기",
        icon: "/icon-192x192.png",
      },
      {
        action: "dismiss",
        title: "닫기",
      },
    ],
    data: {
      url: "/admin/dashboard",
      timestamp: Date.now(),
    },
  };

  // 푸시 데이터가 있는 경우 파싱
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log("[Push SW] 파싱된 푸시 데이터:", pushData);

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
        console.warn("[Push SW] 유효하지 않은 푸시 데이터 형식:", pushData);
      }
    } catch (error) {
      console.error("[Push SW] 푸시 데이터 파싱 오류:", error);

      // 텍스트 데이터인 경우
      try {
        const textData = event.data.text();
        if (textData) {
          notificationData.body = textData;
          console.log("[Push SW] 텍스트 데이터로 설정:", textData);
        }
      } catch (textError) {
        console.error("[Push SW] 텍스트 데이터 파싱도 실패:", textError);
      }
    }
  }

  console.log("[Push SW] 최종 알림 데이터:", notificationData);

  // 알림 표시 (오류 처리 강화)
  const promiseChain = self.registration
    .showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200], // 진동 패턴
      silent: false,
    })
    .then(() => {
      console.log("[Push SW] 알림 표시 성공");
    })
    .catch((error) => {
      console.error("[Push SW] 알림 표시 실패:", error);
      // 알림 표시 실패 시에도 이벤트를 완료 처리
    });

  event.waitUntil(promiseChain);
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  console.log("[Push SW] 알림 클릭됨:", event);

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
  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((clientList) => {
      // 이미 열린 창이 있는지 확인
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);

        if (clientUrl.origin === targetUrl.origin) {
          // 기존 창 포커스하고 해당 페이지로 이동
          return client.focus().then(() => {
            return client.navigate(urlToOpen);
          });
        }
      }

      // 새 창 열기
      return clients.openWindow(urlToOpen);
    });

  event.waitUntil(promiseChain);
});

// 메시지 수신 처리 (클라이언트와 통신)
self.addEventListener("message", (event) => {
  console.log("[Push SW] 메시지 수신:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 네트워크 요청 가로채기 (오프라인 처리)
self.addEventListener("fetch", (event) => {
  // HTML 페이지 요청만 처리 (API 요청 제외)
  if (event.request.mode === "navigate") {
    console.log("[Push SW] 페이지 요청:", event.request.url);

    event.respondWith(
      fetch(event.request).catch(() => {
        // 네트워크 실패 시 오프라인 페이지 반환
        console.log("[Push SW] 네트워크 연결 실패, 오프라인 페이지 제공");
        return caches.match("/offline");
      })
    );
  }

  // 정적 리소스 캐싱 (이미지, CSS, JS 등)
  else if (
    event.request.destination === "image" ||
    event.request.destination === "style" ||
    event.request.destination === "script" ||
    event.request.destination === "font" ||
    event.request.destination === "manifest" ||
    event.request.url.includes("/_next/static/") ||
    event.request.url.includes(".css") ||
    event.request.url.includes(".js") ||
    event.request.url.includes("/static/") ||
    /\.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2|ico|json)(\?|$)/.test(
      event.request.url
    )
  ) {
    console.log(
      "[Push SW] 정적 리소스 요청:",
      event.request.url,
      "타입:",
      event.request.destination
    );

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log("[Push SW] 캐시에서 제공:", event.request.url);
          return cachedResponse;
        }

        console.log("[Push SW] 네트워크에서 다운로드:", event.request.url);
        return fetch(event.request)
          .then((response) => {
            // 성공적인 응답만 캐시
            if (response.status === 200) {
              console.log("[Push SW] 캐시에 저장:", event.request.url);
              const responseClone = response.clone();
              caches.open("essential-cache-v2").then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            console.log("[Push SW] 네트워크 실패:", event.request.url);
            // 정적 리소스 로드 실패 시 기본 이미지 반환 (선택사항)
            if (event.request.destination === "image") {
              return caches.match("/icon-192x192.png");
            }
          });
      })
    );
  }
});
