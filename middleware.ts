import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceMode, isAdminUser } from "@/lib/utils/system/system-mode";
import {
  logSecurityError,
  createSystemLog,
} from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import {
  apiRateLimiter,
  createRateLimitHeaders,
  maliciousBotRateLimiter,
} from "@/lib/utils/system/rate-limit";
import { clearServerAuthCookies } from "@/lib/utils/auth";
import { MALICIOUS_PATTERNS } from "@/lib/constants/security-patterns";

const MIDDLEWARE_CONFIG = {
  // 🌐 공개 접근 가능한 경로들 (인증 불필요)
  // 이 경로들은 로그인하지 않은 사용자도 접근할 수 있습니다.
  PUBLIC_PATHS: [
    "/", // 루트 페이지 (랜딩 페이지)
    "/auth", // 인증 관련 (이메일 확인, 비밀번호 리셋 등)
    "/api/auth", // 인증 API (Supabase 인증)
    "/visit", // 방문자 페이지 (QR코드로 접근)
    "/api/settings", // 설정 API (공개 설정 조회)
    "/api/farms", // 농장 API (공개 농장 정보)
    "/maintenance", // 유지보수 페이지
    "/api/push", // 푸시 알림 API (PWA 알림)
    "/api/visitor", // 방문자 관련 API (방문자 등록)
    "/api/health", // 헬스체크 API (모니터링용)
    "/api/monitoring", // 모니터링 API (모니터링용)
    "/api/push/subscription", // 구독 정리 API (세션 만료 시 필요)
    "/api/404-handler", // 404 핸들러 API
    "/manifest.json", // PWA 매니페스트
    "/sw.js", // Service Worker
    "/workbox-", // Workbox 관련
    "/push-sw.js", // 푸시 Service Worker
    "/terms", // 이용약관
    "/privacy", // 개인정보처리방침
  ] as string[],

  // 🔒 정규식 패턴으로 매칭되는 공개 경로들
  // 동적 경로 매개변수가 포함된 API들을 처리합니다.
  PUBLIC_PATTERNS: [
    /^\/visit\/[^/]+$/, // 특정 농장 방문 페이지 (QR코드로 접근)
    /^\/api\/farms\/[^/]+\/visitors\/check-session$/, // 방문자 세션 체크 API (특정 농장)
    /^\/api\/farms\/[^/]+\/visitors\/count-today$/, // 오늘 방문자 수 API (특정 농장)
    /^\/api\/farms\/[^/]+\/visitors$/, // 농장별 방문자 등록 API (특정 농장)
    /^\/api\/404-handler\/.+$/, // 404 핸들러 API (동적)
  ],
} as const;

/**
 * 🔍 경로 매칭 유틸리티 함수들
 *
 * 경로별 접근 권한과 로깅 여부를 결정하는 헬퍼 함수들입니다.
 * 성능 최적화를 위해 정규식과 배열 메서드를 효율적으로 사용합니다.
 */
const PathMatcher = {
  isPublicPath(pathname: string): boolean {
    // 정확한 경로 매칭 (경로가 정확히 일치하거나 하위 경로인 경우)
    if (
      MIDDLEWARE_CONFIG.PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
      )
    ) {
      return true;
    }

    // 정규식 패턴 매칭 (동적 경로 매개변수가 포함된 API들)
    return MIDDLEWARE_CONFIG.PUBLIC_PATTERNS.some((pattern) =>
      pattern.test(pathname)
    );
  },
};

/**
 * 🔐 토큰 검증 및 갱신 함수 (서버 사이드 전용)
 */
async function validateAndRefreshToken(supabase: any, request: NextRequest) {
  // 쿠키에서 토큰 정보 확인 (세션 만료 감지용)
  // Supabase 쿠키명: sb-{projectId}-auth-token
  const projectId =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0];
  const authCookieName = projectId ? `sb-${projectId}-auth-token` : null;
  const authCookie = authCookieName
    ? request.cookies.get(authCookieName)?.value
    : null;
  const hasTokens = !!authCookie;
  try {
    // 사용자 정보 조회 (보안 강화)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      devLog.warn(`[MIDDLEWARE] User validation error: ${error.message}`);

      // 토큰이 있었지만 유효하지 않음 = 세션 만료
      if (hasTokens) {
        devLog.warn(`[MIDDLEWARE] Session expired - tokens exist but invalid`);
        return { isValid: false, user: null, sessionExpired: true };
      }

      return { isValid: false, user: null, sessionExpired: false };
    }

    if (!user) {
      devLog.warn(`[MIDDLEWARE] No authenticated user found`);

      // 토큰이 있었지만 사용자 없음 = 세션 만료
      if (hasTokens) {
        devLog.warn(`[MIDDLEWARE] Session expired - tokens exist but no user`);
        return { isValid: false, user: null, sessionExpired: true };
      }

      return { isValid: false, user: null, sessionExpired: false };
    }

    // getUser()가 성공하면 이미 유효한 사용자임
    // 토큰 갱신은 Supabase가 자동으로 처리
    devLog.log(`[MIDDLEWARE] User authenticated: ${user.id}`);

    return { isValid: true, user: user, sessionExpired: false };
  } catch (error) {
    devLog.error(`[MIDDLEWARE] Token validation error: ${error}`);

    return { isValid: false, user: null, sessionExpired: hasTokens };
  }
}

/**
 * 🚀 메인 미들웨어 함수
 *
 * 모든 HTTP 요청에 대해 인증, 권한, 로깅, 성능 모니터링을 수행합니다.
 *
 * @param request - Next.js 요청 객체
 * @returns NextResponse 객체 (리다이렉트 또는 다음 단계로 진행)
 *
 * @description
 * 처리 순서:
 * 1. 요청 정보 추출 및 로깅
 * 2. Supabase 인증 상태 확인 및 토큰 검증
 * 3. 유지보수 모드 체크
 * 4. 인증 상태 검증
 *
 * @throws 인증 오류, 유지보수 모드 오류 등이 발생할 수 있지만 모두 적절히 처리됩니다.
 */
export async function middleware(request: NextRequest) {
  // 🌐 클라이언트 정보 추출 (보안 로깅용)
  const clientIP = getClientIP(request); // 실제 클라이언트 IP (프록시 고려)
  const userAgent = getUserAgent(request); // 브라우저/앱 정보
  // ⏱️ 성능 측정 시작
  const start = Date.now();

  // 📍 요청 정보 추출
  const pathname = request.nextUrl.pathname; // 현재 요청 경로

  // 🚫 악성 봇 및 보안 위협 요청 차단
  // 실제 프로젝트에서 사용하지 않는 경로들만 차단
  const maliciousPatterns = MALICIOUS_PATTERNS;

  if (maliciousPatterns.some((pattern) => pattern.test(pathname))) {
    // 악성 봇 Rate Limiting 적용
    const botLimitResult = maliciousBotRateLimiter.checkLimit(clientIP);
    if (!botLimitResult.allowed) {
      devLog.warn(
        `[MIDDLEWARE] Malicious bot rate limited: ${pathname} from IP: ${clientIP}`
      );
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": botLimitResult.retryAfter?.toString() || "60",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }

    devLog.warn(
      `[MIDDLEWARE] Malicious request blocked: ${pathname} from IP: ${clientIP}, UA: ${userAgent}`
    );

    // 악성 요청에 대해 더 강력한 응답
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // 📝 요청 처리 시작 로그
  devLog.log(`[MIDDLEWARE] Processing: ${pathname} from IP: ${clientIP}`);

  // ✅ 퍼블릭 경로는 인증/권한/유지보수 체크 없이 바로 통과
  if (PathMatcher.isPublicPath(pathname)) {
    devLog.log(
      `[MIDDLEWARE] Public path detected, skipping auth/maintenance checks: ${pathname}`
    );
    return NextResponse.next();
  }

  // 🔧 Supabase 클라이언트 생성 및 응답 객체 준비
  let supabaseResponse = NextResponse.next({ request });
  const supabase = await createClient();

  // 👤 사용자 인증 정보 가져오기 및 토큰 검증
  let user = null;
  let isAuthenticated = false;

  try {
    // 토큰 검증 및 갱신 시도 (authService 사용)
    const {
      isValid,
      user: authUser,
      sessionExpired,
    } = await validateAndRefreshToken(supabase, request);
    user = authUser;
    isAuthenticated = isValid;
    devLog.log(
      `[MIDDLEWARE] User: ${
        user?.id ? "authenticated" : "anonymous"
      }, Token valid: ${isAuthenticated}, Session expired: ${sessionExpired}`
    );

    // 세션 만료 감지 시 처리 (토큰은 있었지만 유효하지 않은 경우)
    if (!isAuthenticated && sessionExpired) {
      devLog.warn(
        `[MIDDLEWARE] Session expired detected - redirecting to login`
      );

      // 세션 만료 시에는 userId를 알 수 없으므로 구독 정리는 클라이언트에서 처리
      // (로그인 페이지에서 session_expired=true 파라미터로 구독 정리 수행)

      // 세션 쿠키 정리 (미들웨어에서는 NextResponse cookies API 사용)
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("session_expired", "true");
      const response = NextResponse.redirect(loginUrl);

      // 공통 쿠키 정리 함수 사용
      clearServerAuthCookies(response);

      return response;
    }
  } catch (error) {
    devLog.error(`[MIDDLEWARE] Auth error: ${error}`);
  }

  // 🛠️ 유지보수 모드 체크
  // 시스템 유지보수 중일 때 일반 사용자의 접근을 제한합니다.
  const isMaintenancePath = pathname === "/maintenance"; // 유지보수 페이지 자체
  const isPublicPath = PathMatcher.isPublicPath(pathname); // 공개 접근 가능한 경로

  devLog.log(
    `[MIDDLEWARE] isMaintenancePath: ${isMaintenancePath}, isPublicPath: ${isPublicPath}`
  );

  // 유지보수 모드가 활성화된 경우 관리자만 접근 허용
  if (!isMaintenancePath && !isPublicPath) {
    try {
      // 유지보수 모드 상태 확인 (캐시 활용으로 성능 최적화)
      const maintenanceMode = await isMaintenanceMode();

      if (maintenanceMode) {
        // 관리자는 유지보수 모드에서도 접근 가능 (캐시 활용)
        const isAdmin = user ? await isAdminUser(user.id) : false;

        if (!isAdmin) {
          // 권한 없는 접근 시도 로그 (보안 감사용)
          await createSystemLog(
            "PERMISSION_ERROR",
            `유지보수 모드 접근 권한 없음: 사용자 ${
              user?.id || "anonymous"
            }가 관리자 권한 없이 접근 시도`,
            "warn",
            user?.id,
            "system",
            undefined,
            {
              is_admin: isAdmin,
              pathname,
              action_type: "maintenance_mode_access",
            },
            undefined,
            clientIP,
            userAgent
          ).catch((error: any) => {
            devLog.error(`[MIDDLEWARE] Permission logging error: ${error}`);
          });

          // 유지보수 페이지로 리다이렉트
          const url = request.nextUrl.clone();
          url.pathname = "/maintenance";
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      // 유지보수 모드 체크 실패 시 일반 모드로 간주하고 계속 진행
      // 시스템 오류로 인해 사용자 접근을 차단하지 않습니다.
      devLog.error(`[MIDDLEWARE] Maintenance mode check error: ${error}`);
    }
  }

  // 🔐 인증 체크 - 공개 경로가 아닌 경우 로그인 필요
  // 로그인하지 않은 사용자가 보호된 페이지에 접근하려 할 때 처리합니다.
  if (!isAuthenticated && !isPublicPath) {
    // 관리자 페이지 무단 접근 시도 로그 (보안 위협 감지)
    if (pathname.startsWith("/admin")) {
      await logSecurityError(
        "UNAUTHORIZED_ACCESS",
        `관리자 페이지 무단 접근 시도: ${pathname}`,
        undefined,
        clientIP,
        userAgent
      ).catch((error) => {
        devLog.error(`[MIDDLEWARE] Security logging error: ${error}`);
      });
    }

    // 로그인 페이지로 리다이렉트
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 🚦 Rate Limiting 체크 - API 요청 제한
  // IP당 90초에 100회 요청 제한을 적용합니다.
  // 헬스체크는 Rate Limiting에서 제외
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/health")) {
    const rateLimitResult = apiRateLimiter.checkLimit(clientIP);

    if (!rateLimitResult.allowed) {
      // Rate limit 초과 시 보안 로그 기록
      await logSecurityError(
        "RATE_LIMIT_EXCEEDED",
        `IP ${clientIP}에서 API 요청 제한 초과: ${pathname}`,
        user?.id,
        clientIP,
        userAgent
      ).catch((error) => {
        devLog.error(`[MIDDLEWARE] Rate limit logging error: ${error}`);
      });

      // 429 Too Many Requests 응답 반환
      const response = NextResponse.json(
        {
          error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );

      // Rate limit 헤더 추가
      const headers = createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Rate limit 헤더 추가 (성공한 요청에도)
    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      supabaseResponse.headers.set(key, value);
    });
  }

  // ✅ 요청 처리 완료 - 다음 단계로 진행
  // 성능 측정 로그 (개발 환경에서만)
  const processingTime = Date.now() - start;
  if (processingTime > 100) {
    devLog.warn(
      `[MIDDLEWARE] Slow request: ${pathname} took ${processingTime}ms`
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.(?:ico|png)|api/auth|api/admin|api/settings|api/health|api/monitoring|api/push|api/visitor|api/farms/[^/]+/visitors/check-session|api/farms/[^/]+/visitors/count-today|manifest\\.json|sw\\.js|workbox-|push-sw\\.js|docs/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|html|json)$).*)",
  ],
};
