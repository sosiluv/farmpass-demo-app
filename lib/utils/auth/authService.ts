import { createClient } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { clearAuthCookies } from "@/lib/utils/auth";

// 상태 관리
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// 세션 쿠키 정리 함수 개선
function clearSessionCookies(): void {
  try {
    clearAuthCookies();
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

  // 세션이 이미 만료된 경우(session_expired=true로 온 경우) 쿠키 정리 스킵
  const isAlreadyCleanedByMiddleware =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("session_expired") ===
      "true";

  if (isAlreadyCleanedByMiddleware) {
    devLog.log(
      "미들웨어에서 이미 쿠키 정리됨 - authService에서는 Supabase 로그아웃만 수행"
    );
  }

  // Supabase 로그아웃 (타임아웃 적용)
  try {
    const supabase = createClient();
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

  // 강제 로그아웃이거나 Supabase 실패 시 또는 타임아웃 시 추가 정리
  if (isForceLogout || logoutError || typeof window !== "undefined") {
    if (typeof window !== "undefined") {
      try {
        // 미들웨어에서 이미 정리된 경우 스킵
        if (!isAlreadyCleanedByMiddleware) {
          // 쿠키 정리 (인증 토큰 등)
          clearSessionCookies();
          devLog.log("authService에서 쿠키 정리 수행");
        }
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
