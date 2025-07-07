/**
 * 🦁 Safari 브라우저 진단 및 디버깅 유틸리티
 *
 * Safari에서 발생할 수 있는 문제들을 진단하고 로깅하는 함수들입니다.
 */

import { devLog } from "@/lib/utils/logging/dev-logger";
import { diagnoseSafariIssues, isSafari } from "./safari-compat";

/**
 * Safari 특정 문제들을 진단하고 상세한 정보를 로깅
 */
export function diagnoseSafariLoginIssues(): {
  summary: string;
  issues: string[];
  recommendations: string[];
} {
  const diagnosis = diagnoseSafariIssues();
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (diagnosis.isSafari) {
    devLog.log("🦁 Safari 브라우저 감지됨", diagnosis);

    // 프라이빗 브라우징 모드 체크
    if (diagnosis.isPrivateBrowsing) {
      issues.push(
        "프라이빗 브라우징 모드에서 localStorage/sessionStorage 접근 제한"
      );
      recommendations.push(
        "일반 브라우징 모드로 전환하거나 쿠키 기반 세션 사용"
      );
    }

    // localStorage 접근 문제
    if (!diagnosis.localStorageAvailable) {
      issues.push("localStorage에 접근할 수 없음");
      recommendations.push("브라우저 설정에서 로컬 데이터 허용 확인");
    }

    // sessionStorage 접근 문제
    if (!diagnosis.sessionStorageAvailable) {
      issues.push("sessionStorage에 접근할 수 없음");
      recommendations.push("브라우저 설정에서 로컬 데이터 허용 확인");
    }

    // Crypto API 문제
    if (!diagnosis.cryptoUUIDAvailable) {
      issues.push("crypto.randomUUID() API 사용 불가");
      recommendations.push("대체 UUID 생성 방법 사용됨");
    }

    // 알림 지원 문제
    if (!diagnosis.notificationSupported) {
      issues.push("브라우저 알림 API 지원 안함");
      recommendations.push("푸시 알림 기능 사용 불가");
    }

    // 서비스 워커 문제
    if (!diagnosis.serviceWorkerSupported) {
      issues.push("서비스 워커 지원 안함");
      recommendations.push("오프라인 기능 및 푸시 알림 제한됨");
    }

    // iOS Safari 특정 문제들
    const userAgent =
      typeof window !== "undefined" ? window.navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isIOSSafari = isIOS && diagnosis.isSafari;

    if (isIOSSafari) {
      issues.push("iOS Safari에서 세션 유지 문제 가능성");
      recommendations.push("앱을 홈 화면에 추가하여 PWA 모드로 사용 권장");

      // iOS 버전 체크
      const iOSVersion = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (iOSVersion) {
        const majorVersion = parseInt(iOSVersion[1]);
        if (majorVersion < 14) {
          issues.push(
            `iOS ${majorVersion} 버전에서 브라우저 호환성 문제 가능성`
          );
          recommendations.push("iOS 14 이상으로 업데이트 권장");
        }
      }
    }
  }

  const summary =
    issues.length > 0
      ? `Safari에서 ${issues.length}개의 잠재적 문제 감지됨`
      : "Safari 호환성 문제 없음";

  return {
    summary,
    issues,
    recommendations,
  };
}

/**
 * 로그인 과정에서 Safari 관련 에러 로깅
 */
export function logSafariLoginError(error: Error, context: string): void {
  if (!isSafari()) return;

  const diagnosis = diagnoseSafariLoginIssues();

  devLog.error("🦁 Safari 로그인 에러:", {
    context,
    error: error.message,
    stack: error.stack,
    diagnosis,
  });

  // 특정 에러 패턴 체크
  const errorMessage = error.message.toLowerCase();

  if (
    errorMessage.includes("quotaexceedederror") ||
    errorMessage.includes("localstorage")
  ) {
    devLog.warn("🦁 Safari localStorage 할당량 초과 또는 접근 에러");
  }

  if (errorMessage.includes("networkerror") || errorMessage.includes("fetch")) {
    devLog.warn("🦁 Safari 네트워크 에러 - CORS 또는 보안 정책 문제 가능성");
  }

  if (errorMessage.includes("unhandled")) {
    devLog.warn("🦁 Safari에서 처리되지 않은 Promise rejection");
  }
}

/**
 * Safari용 로그인 재시도 함수
 */
export async function safariLoginRetry<T>(
  loginFunction: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await loginFunction();

      if (attempt > 1) {
        devLog.log(`🦁 Safari 로그인 재시도 성공 (${attempt}/${maxRetries})`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      logSafariLoginError(lastError, `로그인 시도 ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        devLog.warn(
          `🦁 Safari 로그인 재시도 (${attempt}/${maxRetries}) - ${delayMs}ms 후 재시도`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error("Safari 로그인 재시도 실패");
}
