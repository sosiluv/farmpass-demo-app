// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// 배포 환경에서만 Sentry 초기화
if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1, // 10% 샘플링 (성능 최적화)

    // 환경 정보 추가
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

    // Edge 환경 특화 에러 필터링
    beforeSend(event) {
      // Edge 런타임 에러는 별도 태그 추가
      if (event.exception && event.exception.values) {
        const exception = event.exception.values[0];
        if (exception.value && exception.value.includes("Edge")) {
          event.tags = { ...event.tags, edge_error: true };
        }
      }

      return event;
    },

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
