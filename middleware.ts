/**
 * 🛡️ Next.js 미들웨어 - 전역 요청 처리 및 보안 관리
 *
 * 이 파일은 모든 HTTP 요청에 대해 다음 기능을 수행합니다:
 * 1. 사용자 인증 상태 확인
 * 2. 유지보수 모드 관리
 * 3. 페이지 이동 로깅
 * 4. 성능 모니터링
 * 5. 보안 이벤트 추적
 * 6. 접근 권한 제어
 * 7. API 요청 제한 (Rate Limiting)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceMode, isAdminUser } from "@/lib/utils/system/system-mode";
import {
  logSecurityError,
  logPermissionError,
  logPerformanceError,
  logPageView,
} from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import {
  apiRateLimiter,
  createRateLimitHeaders,
} from "@/lib/utils/system/rate-limit";

/**
 * 🛡️ 미들웨어 설정 상수
 *
 * 경로별 접근 권한과 로깅 설정을 중앙에서 관리합니다.
 * 새로운 경로 추가 시 이곳에서만 수정하면 됩니다.
 *
 * @description
 * - EXCLUDE_FROM_LOGGING: 로깅에서 제외할 페이지들 (분석 가치가 낮은 기술적/필수 경유 페이지들)
 * - PUBLIC_PATHS: 공개 접근 가능한 경로들 (인증 불필요)
 * - PUBLIC_PATTERNS: 정규식 패턴으로 매칭되는 공개 경로들
 * - STATIC_EXTENSIONS: 정적 파일 확장자들 (미들웨어 처리 제외)
 * - PERFORMANCE_THRESHOLDS: 성능 임계값 설정
 */
const MIDDLEWARE_CONFIG = {
  // 📊 로깅에서 제외할 페이지들 (분석 가치가 낮은 기술적/필수 경유 페이지들)
  EXCLUDE_FROM_LOGGING: [
    "/", // 루트 페이지 (첫 진입점, 분석 가치 낮음)
    "/login", // 로그인 페이지 (필수 경유지)
    "/register", // 회원가입 페이지
    "/reset-password", // 비밀번호 리셋 페이지
    "/maintenance", // 유지보수 페이지
  ] as string[],

  // 🌐 공개 접근 가능한 경로들 (인증 불필요)
  // 이 경로들은 로그인하지 않은 사용자도 접근할 수 있습니다.
  PUBLIC_PATHS: [
    "/", // 루트 페이지 (랜딩 페이지)
    "/login", // 로그인 페이지
    "/auth", // 인증 관련 (이메일 확인, 비밀번호 리셋 등)
    "/api/auth", // 인증 API (Supabase 인증)
    "/register", // 회원가입
    "/reset-password", // 비밀번호 리셋
    "/visit", // 방문자 페이지 (QR코드로 접근)
    "/api/settings", // 설정 API (공개 설정 조회)
    "/api/farms", // 농장 API (공개 농장 정보)
    "/maintenance", // 유지보수 페이지
    "/api/push", // 푸시 알림 API (PWA 알림)
    "/api/visitor", // 방문자 관련 API (방문자 등록)
    "/api/health", // 헬스체크 API (모니터링용)
    "/api/monitoring", // 모니터링 API (모니터링용)
  ] as string[],

  // 🔒 정규식 패턴으로 매칭되는 공개 경로들
  // 동적 경로 매개변수가 포함된 API들을 처리합니다.
  PUBLIC_PATTERNS: [
    /^\/api\/farms\/[^/]+\/visitors\/check-session$/, // 방문자 세션 체크 API (특정 농장)
    /^\/api\/farms\/[^/]+\/visitors\/count-today$/, // 오늘 방문자 수 API (특정 농장)
  ],

  // 📁 정적 파일 확장자들
  // 이 확장자를 가진 파일들은 미들웨어 처리에서 제외됩니다.
  STATIC_EXTENSIONS: [
    ".ico", // 파비콘
    ".png", // PNG 이미지
    ".jpg", // JPEG 이미지
    ".jpeg", // JPEG 이미지
    ".gif", // GIF 이미지
    ".svg", // SVG 벡터 이미지
    ".json", // JSON 파일
    ".js", // JavaScript 파일
    ".css", // CSS 스타일시트
    ".woff", // 웹폰트 (WOFF)
    ".woff2", // 웹폰트 (WOFF2)
  ] as string[],

  // ⚡ 성능 임계값
  // 성능 모니터링을 위한 설정값들입니다.
  PERFORMANCE_THRESHOLDS: {
    API_SLOW_THRESHOLD: 1000, // 1초 이상 걸리는 API 요청을 느린 요청으로 간주
    LOGGING_ENABLED: true, // 페이지 이동 로깅 활성화 여부
  },
} as const;

/**
 * 🔍 경로 매칭 유틸리티 함수들
 *
 * 경로별 접근 권한과 로깅 여부를 결정하는 헬퍼 함수들입니다.
 * 성능 최적화를 위해 정규식과 배열 메서드를 효율적으로 사용합니다.
 */
const PathMatcher = {
  /**
   * 경로가 공개 접근 가능한지 확인
   *
   * @param pathname - 확인할 경로 (예: "/admin/dashboard")
   * @returns 공개 접근 가능하면 true, 그렇지 않으면 false
   *
   * @description
   * 1. 정확한 경로 매칭: PUBLIC_PATHS 배열의 경로와 정확히 일치하거나 하위 경로인지 확인
   * 2. 정규식 패턴 매칭: PUBLIC_PATTERNS 배열의 정규식과 일치하는지 확인
   *
   * @example
   * isPublicPath("/login") // true
   * isPublicPath("/admin/dashboard") // false
   * isPublicPath("/api/farms/123/visitors/check-session") // true (정규식 매칭)
   */
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

  /**
   * 정적 파일인지 확인
   *
   * @param pathname - 확인할 경로
   * @returns 정적 파일이면 true, 그렇지 않으면 false
   *
   * @description
   * 정적 파일들은 미들웨어 처리에서 제외하여 성능을 향상시킵니다.
   * Next.js 내장 파일, API 요청, 이미지, 폰트, 스타일시트 등을 포함합니다.
   *
   * @example
   * isStaticFile("/_next/static/chunks/main.js") // true
   * isStaticFile("/api/users") // true (API 요청)
   * isStaticFile("/admin/dashboard") // false
   */
  isStaticFile(pathname: string): boolean {
    return (
      pathname.startsWith("/_next") || // Next.js 내장 파일들
      pathname.startsWith("/api") || // API 요청들 (로깅 대상이 아님)
      MIDDLEWARE_CONFIG.STATIC_EXTENSIONS.some((ext) =>
        pathname.endsWith(ext)
      ) || // 정적 파일 확장자
      pathname.includes("workbox-") || // PWA 서비스 워커 관련
      pathname.includes("sw.js") // 서비스 워커 파일
    );
  },

  /**
   * 로깅 대상인지 확인
   *
   * @param pathname - 확인할 경로
   * @returns 로깅 대상이면 true, 그렇지 않으면 false
   *
   * @description
   * 페이지 이동 분석을 위해 의미있는 사용자 행동만 로깅합니다.
   * 정적 파일, API 요청, 기술적 페이지들은 제외합니다.
   *
   * @example
   * shouldLog("/admin/dashboard") // true
   * shouldLog("/_next/static/chunks/main.js") // false
   * shouldLog("/") // false (EXCLUDE_FROM_LOGGING에 포함)
   */
  shouldLog(pathname: string): boolean {
    return (
      !PathMatcher.isStaticFile(pathname) && // 정적 파일이 아니고
      !MIDDLEWARE_CONFIG.EXCLUDE_FROM_LOGGING.includes(pathname) // 로깅 제외 목록에 없어야 함
    );
  },
};

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
 * 2. Supabase 인증 상태 확인
 * 3. 페이지 이동 로깅 (비동기 처리)
 * 4. 유지보수 모드 체크
 * 5. 인증 상태 검증
 * 6. 성능 모니터링
 *
 * @throws 인증 오류, 유지보수 모드 오류 등이 발생할 수 있지만 모두 적절히 처리됩니다.
 */
export async function middleware(request: NextRequest) {
  // ⏱️ 성능 측정 시작
  const start = Date.now();

  // 📍 요청 정보 추출
  const pathname = request.nextUrl.pathname; // 현재 요청 경로
  const referer = request.headers.get("referer") || ""; // 이전 페이지 URL

  // 🌐 클라이언트 정보 추출 (보안 로깅용)
  const clientIP = getClientIP(request); // 실제 클라이언트 IP (프록시 고려)
  const userAgent = getUserAgent(request); // 브라우저/앱 정보

  // 📝 요청 처리 시작 로그
  devLog.log(`[MIDDLEWARE] Processing: ${pathname} from IP: ${clientIP}`);

  // 🔧 Supabase 클라이언트 생성 및 응답 객체 준비
  // NextResponse.next()는 요청을 다음 단계로 전달하는 기본 응답을 생성합니다.
  let supabaseResponse = NextResponse.next({ request });
  const supabase = await createClient();

  // 👤 사용자 인증 정보 가져오기
  let user = null;
  try {
    // Supabase에서 현재 사용자의 인증 상태를 확인합니다.
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    // 인증 상태 로깅 (개발 환경에서만)
    devLog.log(
      `[MIDDLEWARE] User: ${user?.id ? "authenticated" : "anonymous"}`
    );
  } catch (error) {
    // 인증 오류가 발생해도 공개 경로는 접근 가능하도록 계속 진행
    devLog.error(`[MIDDLEWARE] Auth error: ${error}`);
  }

  // 📊 페이지 이동 로깅 (성능 최적화)
  // 사용자의 페이지 이동 패턴을 분석하기 위한 로깅입니다.
  if (
    MIDDLEWARE_CONFIG.PERFORMANCE_THRESHOLDS.LOGGING_ENABLED &&
    PathMatcher.shouldLog(pathname)
  ) {
    try {
      // 이전 페이지 경로 추출
      let fromPath = "/";
      if (referer) {
        const refererUrl = new URL(referer);
        fromPath = refererUrl.pathname;
      }

      // PWA 관련 요청이나 자동 요청이 아닌 경우에만 로깅
      // 서비스 워커나 매니페스트 파일 요청은 제외합니다.
      // if (!fromPath.endsWith(".json") && !fromPath.includes("sw.js")) {
      //   // 로깅을 비동기로 처리하여 응답 지연 방지
      //   // .catch()로 로깅 실패가 전체 요청에 영향을 주지 않도록 합니다.
      //   logPageView(fromPath, pathname, user?.id, {
      //     ip: clientIP,
      //     email: user?.email,
      //     userAgent: userAgent,
      //   }).catch((error) => {
      //     devLog.error(`[MIDDLEWARE] Logging error: ${error}`);
      //   });
      // }
    } catch (error) {
      // 로깅 처리 중 오류가 발생해도 요청 처리는 계속 진행
      devLog.warn(`[MIDDLEWARE] Logging failed: ${error}`);
    }
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
      // 유지보수 모드 상태 확인 (캐시 우회하여 최신 상태 확인)
      const maintenanceMode = await isMaintenanceMode(true);

      if (maintenanceMode) {
        // 관리자는 유지보수 모드에서도 접근 가능
        const isAdmin = user ? await isAdminUser(user.id) : false;

        if (!isAdmin) {
          devLog.log(`[MIDDLEWARE] Redirecting to maintenance page`);

          // 권한 없는 접근 시도 로그 (보안 감사용)
          await logPermissionError(
            "maintenance_mode",
            "access",
            user?.id,
            "admin"
          ).catch((error) => {
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
  if (!user && !isPublicPath) {
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
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 🚦 Rate Limiting 체크 - API 요청 제한
  // IP당 90초에 100회 요청 제한을 적용합니다.
  if (pathname.startsWith("/api/")) {
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

  // ⚡ 성능 모니터링 - 느린 API 요청 감지
  // API 응답 시간이 임계값을 초과하면 성능 이슈로 로깅합니다.
  const duration = Date.now() - start;
  if (
    duration > MIDDLEWARE_CONFIG.PERFORMANCE_THRESHOLDS.API_SLOW_THRESHOLD &&
    pathname.startsWith("/api/")
  ) {
    await logPerformanceError(
      pathname,
      duration,
      MIDDLEWARE_CONFIG.PERFORMANCE_THRESHOLDS.API_SLOW_THRESHOLD,
      user?.id
    ).catch((error) => {
      devLog.error(`[MIDDLEWARE] Performance logging error: ${error}`);
    });
  }

  // 🐛 성능 로그 (개발 환경에서만)
  // 개발 중에 느린 요청을 즉시 확인할 수 있도록 합니다.
  if (process.env.NODE_ENV === "development" && duration > 500) {
    devLog.warn(`[MIDDLEWARE] Slow request: ${pathname} took ${duration}ms`);
  }

  // ✅ 요청 처리 완료 - 다음 단계로 진행
  return supabaseResponse;
}

/**
 * 🎯 미들웨어 적용 범위 설정
 *
 * 정적 파일, 이미지, 인증 API 등은 미들웨어에서 제외하여 성능을 최적화합니다.
 *
 * @description
 * matcher 패턴은 정규식을 사용하여 미들웨어가 처리할 경로를 지정합니다.
 * 제외되는 경로들:
 * - _next/static: Next.js 정적 파일들
 * - _next/image: 이미지 최적화 파일들
 * - favicon.ico/favicon.png: 파비콘 파일들
 * - api/auth: 인증 API들 (Supabase가 처리)
 * - api/admin: 관리자 API들 (API 라우트에서 직접 권한 처리)
 * - api/settings: 공개 설정 API들
 * - api/health: 헬스체크 API (모니터링용)
 * - api/monitoring: 모니터링 API (모니터링용)
 * - api/push: 푸시 알림 API (PWA 알림)
 * - api/visitor: 방문자 관련 API (방문자 등록)
 * - api/farms/.../visitors/check-session: 공개 방문자 세션 체크 API
 * - manifest.json: PWA 매니페스트 파일
 * - sw.js: 서비스 워커 파일
 * - workbox-*: PWA 워크박스 관련 파일들
 * - push-sw.js: 푸시 알림 서비스 워커
 * - docs/: 문서 페이지들 (HTML 파일들)
 * - 정적 파일들: 이미지, CSS, JS, 폰트, HTML, JSON 파일들
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (authentication APIs)
     * - api/admin (admin APIs - handled by API routes themselves)
     * - api/settings (public settings APIs)
     * - api/farms/.../visitors/check-session (public visitor session check API)
     * - static files (svg, png, jpg, jpeg, gif, webp, css, js, etc.)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon\\.(?:ico|png)|api/auth|api/admin|api/settings|api/health|api/monitoring|api/push|api/visitor|api/farms/[^/]+/visitors/check-session|manifest\\.json|sw\\.js|workbox-|push-sw\\.js|docs/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|html|json)$).*)",
  ],
};
