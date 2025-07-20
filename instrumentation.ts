import * as Sentry from "@sentry/nextjs";

export async function register() {
  // 배포 환경에서만 Sentry 설정 로드
  if (process.env.NODE_ENV === "production") {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config");
    }
  }
}

// 배포 환경에서만 에러 캡처 함수 export
export const onRequestError =
  process.env.NODE_ENV === "production"
    ? Sentry.captureRequestError
    : undefined;
