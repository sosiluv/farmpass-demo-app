/**
 * 🍪 쿠키 관리 유틸리티
 *
 * Supabase 인증 쿠키를 안전하게 관리하기 위한 공통 함수들입니다.
 */

/**
 * Supabase 프로젝트 ID 추출
 */
export function getSupabaseProjectId(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  return supabaseUrl.split("//")[1]?.split(".")[0] || null;
}

/**
 * Supabase 인증 관련 쿠키명 목록
 */
export function getSupabaseAuthCookies(): string[] {
  const projectId = getSupabaseProjectId();
  if (!projectId) return [];

  return [
    `sb-${projectId}-auth-token`,
    `sb-${projectId}-auth-token-code-verifier`,
  ];
}

/**
 * 클라이언트 사이드에서 인증/세션 쿠키 삭제 (AuthService용)
 */
export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;

  // Supabase + Vercel 인증/세션 쿠키 삭제
  const cookiesToClear = [
    ...getSupabaseAuthCookies(),
    "_vercel_jwt",
    "_vercel_session",
  ];

  cookiesToClear.forEach((cookieName) => {
    if (cookieName) {
      // 다양한 도메인과 경로에서 쿠키 삭제 (브라우저 호환성)
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${
        window.location.hostname
      };${location.protocol === "https:" ? " Secure;" : ""}`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${
        location.protocol === "https:" ? " Secure;" : ""
      }`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${
        window.location.hostname
      };${location.protocol === "https:" ? " Secure;" : ""}`;
    }
  });
}

/**
 * 서버 사이드에서 인증/세션 쿠키 삭제 (Middleware용)
 */
export function clearServerAuthCookies(response: any): void {
  const cookiesToDelete = [
    ...getSupabaseAuthCookies(),
    "_vercel_jwt",
    "_vercel_session",
  ];

  cookiesToDelete.forEach((cookieName) => {
    if (cookieName) {
      response.cookies.delete(cookieName);
    }
  });
}
