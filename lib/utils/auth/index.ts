/**
 * 🔐 인증 관련 유틸리티 모듈
 *
 * 쿠키 관리, 세션 처리 등 인증과 관련된 유틸리티 함수들을 제공합니다.
 */

// AuthService exports
export { refreshToken, handleSessionExpired, logout } from "./authService";

// Cookie utilities exports
export {
  clearAuthCookies,
  clearServerAuthCookies,
  getSupabaseProjectId,
  getSupabaseAuthCookies,
} from "./cookie-utils";
