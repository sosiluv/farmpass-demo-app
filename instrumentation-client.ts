import * as Sentry from "@sentry/nextjs";

// 배포 환경에서만 Sentry 초기화
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Add optional integrations for additional features
    integrations: [
      Sentry.replayIntegration(),
      Sentry.browserTracingIntegration(),
    ],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1, // 10% 샘플링 (성능 최적화)

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // 환경 정보 추가
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

    // 에러 필터링 및 처리
    beforeSend(event) {
      // 네트워크 에러는 제외 (너무 많음)
      if (event.exception && event.exception.values) {
        const exception = event.exception.values[0];
        if (exception.value && exception.value.includes("Failed to fetch")) {
          return null; // 네트워크 에러는 제외
        }
      }

      // 인증 에러는 별도 태그 추가
      if (event.exception && event.exception.values) {
        const exception = event.exception.values[0];
        if (
          exception.value &&
          (exception.value.includes("Unauthorized") ||
            exception.value.includes("Admin access required"))
        ) {
          event.tags = { ...event.tags, auth_error: true };
        }
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // 민감한 정보 제거
      if (breadcrumb.data && breadcrumb.data.url) {
        // URL에서 민감한 정보 제거
        const url = new URL(breadcrumb.data.url);
        if (url.searchParams.has("token") || url.searchParams.has("password")) {
          url.searchParams.delete("token");
          url.searchParams.delete("password");
          breadcrumb.data.url = url.toString();
        }
      }
      return breadcrumb;
    },

    // 성능 모니터링 설정
    attachStacktrace: true,

    // 에러 컨텍스트 추가
    includeLocalVariables: true,
  });
}

// 라우터 전환 모니터링 (Sentry 요구사항)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
