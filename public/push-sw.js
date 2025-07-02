// 푸시 알림 전용 Service Worker
console.log("[Push SW] Service Worker 로드됨");

// Service Worker 설치
self.addEventListener("install", (event) => {
  console.log("[Push SW] Service Worker 설치됨");
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  console.log("[Push SW] Service Worker 활성화됨");
  event.waitUntil(self.clients.claim());
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
        }
      } catch (textError) {
        console.error("[Push SW] 텍스트 데이터 파싱도 실패:", textError);
      }
    }
  }

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

// 알림 닫기 처리
self.addEventListener("notificationclose", (event) => {
  console.log("[Push SW] 알림 닫힘:", event);
});

// 메시지 수신 처리 (클라이언트와 통신)
self.addEventListener("message", (event) => {
  console.log("[Push SW] 메시지 수신:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("[Push SW] Service Worker 초기화 완료");
