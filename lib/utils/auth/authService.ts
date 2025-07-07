import { createClient } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";

import { apiClient } from "@/lib/utils/data";
import { clearClientCookies } from "@/lib/utils/auth";
import {
  safeLocalStorageAccess,
  safeSessionStorageAccess,
} from "@/lib/utils/browser/safari-compat";

// 구독 해제를 위한 브라우저 API 직접 호출 (훅 대신)
async function cleanupBrowserSubscription(): Promise<{
  success: boolean;
  endpoint?: string;
}> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      devLog.log("브라우저에서 푸시 알림을 지원하지 않습니다.");
      return { success: false };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      devLog.log("기존 구독 발견:", subscription.endpoint);
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      devLog.log("브라우저 구독 해제 완료");
      return { success: true, endpoint };
    } else {
      devLog.log("삭제할 구독이 없습니다.");
      return { success: false };
    }
  } catch (error) {
    devLog.warn("브라우저 구독 해제 실패:", error);
    return { success: false };
  }
}

// 상태 관리
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// 세션 쿠키 정리 함수 개선
function clearSessionCookies(): void {
  try {
    clearClientCookies();
    devLog.log("세션 쿠키 정리 완료");
  } catch (error) {
    devLog.warn("세션 쿠키 정리 실패:", error);
  }
}

// 토큰 갱신
export async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        devLog.warn("토큰 갱신 실패:", error);
        return false;
      }

      devLog.log("토큰 갱신 성공");
      return true;
    } catch (error) {
      devLog.error("토큰 갱신 중 오류:", error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// 세션 만료 처리 (토스트 제거, 상태만 반환)
export async function handleSessionExpired(): Promise<{
  success: boolean;
  message: string;
}> {
  devLog.warn("세션 만료 감지");

  try {
    await logout(true);
    return {
      success: true,
      message: "세션이 만료되었습니다. 보안을 위해 자동으로 로그아웃됩니다.",
    };
  } catch (error) {
    devLog.error("세션 만료 처리 중 오류:", error);
    return {
      success: false,
      message: "세션 만료 처리 중 오류가 발생했습니다.",
    };
  }
}

// 로그아웃
export async function logout(isForceLogout = false): Promise<void> {
  let logoutError = null;

  // Supabase 로그아웃 (타임아웃 적용)
  try {
    const supabase = createClient();

    // 5초 타임아웃 적용
    const logoutPromise = supabase.auth.signOut();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Supabase 로그아웃 타임아웃")), 5000);
    });

    await Promise.race([logoutPromise, timeoutPromise]);
    devLog.log("Supabase 로그아웃 성공");
  } catch (error) {
    devLog.warn("Supabase 로그아웃 실패:", error);
    logoutError = error;
  }

  // 구독 정리 (브라우저 + 서버) - 타임아웃 적용
  if (typeof window !== "undefined") {
    try {
      // 구독 정리 타임아웃 (3초)
      const cleanupPromise = (async () => {
        // 1. 브라우저 구독 해제
        const browserResult = await cleanupBrowserSubscription();

        // 2. 서버 구독 정리 (API 사용)
        if (browserResult.success && browserResult.endpoint) {
          // 브라우저 구독이 있었으면 서버에서도 정리
          try {
            // 세션 만료 시에도 API 호출 가능하도록 fetch 직접 사용
            const response = await fetch("/api/push/subscription", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                // 세션 만료 시에도 요청이 가능하도록 헤더 추가
              },
              body: JSON.stringify({ endpoint: browserResult.endpoint }),
            });

            if (response.ok) {
              devLog.log("서버 구독 정리 완료");
            } else {
              devLog.warn("서버 구독 정리 실패:", response.status);
            }
          } catch (error) {
            devLog.warn("서버 구독 정리 실패:", error);
            // 구독 정리 실패해도 로그아웃은 계속 진행
          }
        }
      })();

      const cleanupTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("구독 정리 타임아웃")), 3000);
      });

      await Promise.race([cleanupPromise, cleanupTimeoutPromise]);
    } catch (error) {
      devLog.warn("구독 정리 실패:", error);
      // 구독 정리 실패해도 로그아웃은 계속 진행
    }
  }

  // 강제 로그아웃이거나 Supabase 실패 시 또는 타임아웃 시 추가 정리
  if (isForceLogout || logoutError || typeof window !== "undefined") {
    if (typeof window !== "undefined") {
      try {
        // 쿠키 정리 (인증 토큰 등)
        clearSessionCookies();
      } catch (error) {
        devLog.warn("클라이언트 상태 정리 실패:", error);
      }
    }
  }

  // 클라이언트 사이드에서 리다이렉트 (강제 로그아웃 시에만)
  if (typeof window !== "undefined" && isForceLogout) {
    // 강제 로그아웃 시에만 리다이렉트
    window.location.replace("/login");
  }
}

// 토큰 만료 시간 확인
export async function isTokenExpired(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // 사용자 정보가 없거나 에러가 있으면 만료된 것으로 간주
    if (error || !user) {
      return true;
    }

    return false;
  } catch (error) {
    devLog.error("토큰 만료 확인 실패:", error);
    return true;
  }
}

// 세션 유효성 검증
export async function validateSession(): Promise<{
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        isValid: false,
        needsRefresh: false,
        error: error.message,
      };
    }

    if (!user) {
      return {
        isValid: false,
        needsRefresh: false,
        error: "사용자가 인증되지 않았습니다.",
      };
    }

    // getUser()는 서버에서 실시간으로 검증하므로 유효한 사용자면 토큰도 유효
    return {
      isValid: true,
      needsRefresh: false,
    };
  } catch (error) {
    devLog.error("세션 유효성 검증 실패:", error);
    return {
      isValid: false,
      needsRefresh: false,
      error: "세션 유효성 검증 중 오류가 발생했습니다.",
    };
  }
}
