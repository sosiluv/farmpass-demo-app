/**
 * =================================
 * 🚦 API 요청 제한 (Rate Limiting) 유틸리티
 * =================================
 *
 * IP 기반으로 API 요청 횟수를 제한하여 서버 보호 및 남용 방지
 *
 * 주요 기능:
 * - IP별 요청 횟수 추적 및 제한
 * - 슬라이딩 윈도우 방식의 시간 기반 제한
 * - 환경변수를 통한 동적 설정
 * - Rate Limit 헤더 자동 생성
 *
 * 사용 예시:
 * ```typescript
 * // 미들웨어에서 사용
 * const result = apiRateLimiter.checkLimit(clientIP);
 * if (!result.allowed) {
 *   return new Response("Rate limit exceeded", { status: 429 });
 * }
 *
 * // 헤더 추가
 * const headers = createRateLimitHeaders(result);
 * ```
 */

/**
 * Rate Limiter 설정 인터페이스
 */
export interface RateLimitConfig {
  maxRequests: number; // 최대 허용 요청 수 (환경변수에서 설정)
  windowMs: number; // 시간 윈도우 (밀리초) - 이 시간 내에 maxRequests만큼 요청 허용
  identifier?: string; // 제한 식별자 (기본값: "ip", 사용자 ID 등으로 확장 가능)
}

/**
 * Rate Limit 체크 결과 인터페이스
 */
export interface RateLimitResult {
  allowed: boolean; // 요청 허용 여부 (true: 허용, false: 차단)
  remaining: number; // 남은 요청 수 (0이면 제한 도달)
  resetTime: number; // 제한 초기화 시간 (타임스탬프)
  retryAfter?: number; // 재시도 대기 시간 (초) - 제한 초과 시에만 제공
}

/**
 * Rate Limiter 클래스
 *
 * 슬라이딩 윈도우 방식으로 요청을 추적하고 제한합니다.
 * 메모리 기반으로 동작하며, 서버 재시작 시 초기화됩니다.
 */
export class RateLimiter {
  private requests = new Map<string, number[]>(); // IP별 요청 시간 기록
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      identifier: "ip", // 기본 식별자는 IP
      ...config,
    };
  }

  /**
   * 요청 허용 여부 확인
   *
   * 슬라이딩 윈도우 방식으로 동작:
   * - 현재 시간에서 windowMs 이전의 요청은 무시
   * - windowMs 내의 요청만 카운트
   * - maxRequests를 초과하면 차단
   *
   * @param identifier 요청 식별자 (IP, 사용자 ID 등)
   * @returns RateLimitResult - 요청 허용 여부와 상세 정보
   */
  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // 윈도우 시간 이전의 요청 제거 (만료된 요청 정리)
    // 이는 메모리 누수를 방지하고 정확한 카운트를 보장합니다
    const validRequests = userRequests.filter(
      (time) => now - time < this.config.windowMs
    );

    // 남은 요청 수 계산 (음수가 되지 않도록 보장)
    const remaining = Math.max(
      0,
      this.config.maxRequests - validRequests.length
    );

    // 제한 초기화 시간 (현재 시간 + 윈도우 시간)
    const resetTime = now + this.config.windowMs;

    if (validRequests.length >= this.config.maxRequests) {
      // 제한 초과: 재시도 대기 시간 계산
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter, // 클라이언트에게 재시도 시간 안내
      };
    }

    // 요청 허용: 새 요청 시간 추가
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      allowed: true,
      remaining: this.config.maxRequests - validRequests.length,
      resetTime,
    };
  }

  /**
   * 특정 식별자의 요청 기록 제거
   *
   * 사용자 차단 해제나 테스트 목적으로 사용
   *
   * @param identifier 요청 식별자
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * 모든 요청 기록 초기화
   *
   * 서버 재시작이나 긴급 상황에서 사용
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * 현재 상태 정보 조회
   *
   * 디버깅이나 모니터링 목적으로 사용
   *
   * @param identifier 요청 식별자
   * @returns 현재 제한 상태 상세 정보
   */
  getStatus(identifier: string): {
    current: number; // 현재 요청 수
    limit: number; // 최대 허용 요청 수
    remaining: number; // 남은 요청 수
    resetTime: number; // 초기화 시간
  } {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(
      (time) => now - time < this.config.windowMs
    );

    return {
      current: validRequests.length,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - validRequests.length),
      resetTime: now + this.config.windowMs,
    };
  }
}

/**
 * =================================
 * 전역 Rate Limiter 인스턴스들
 * =================================
 *
 * 환경변수를 통한 설정 가능:
 * - RATE_LIMIT_MAX: 최대 요청 수
 * - RATE_LIMIT_WINDOW_MS: 제한 시간 (밀리초)
 * - VISITOR_RATE_LIMIT_MAX: 방문자 등록 최대 수
 * - VISITOR_RATE_LIMIT_WINDOW_MS: 방문자 등록 제한 시간
 */

/**
 * 일반 API 요청 제한
 *
 * 모든 API 엔드포인트에 적용 (인증, 헬스체크 등 제외)
 * 기본값: IP당 90초에 100회 요청
 */
export const apiRateLimiter = new RateLimiter({
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "90000"), // 90초
});

/**
 * 방문자 등록 제한
 *
 * 방문자 등록 API에만 적용
 * 기본값: IP당 24시간에 100회 등록
 *
 * 시스템 설정과 연동:
 * - 일일 최대 방문자 수 반영
 * - 재방문 허용 간격 반영
 */
export const visitorRegistrationRateLimiter = new RateLimiter({
  maxRequests: parseInt(process.env.VISITOR_RATE_LIMIT_MAX || "100"), // 일일 최대 방문자 수
  windowMs: parseInt(process.env.VISITOR_RATE_LIMIT_WINDOW_MS || "86400000"), // 재방문 허용 간격 (24시간)
});

/**
 * =================================
 * Rate Limit 헤더 생성 함수
 * =================================
 *
 * RFC 6585 표준을 따르는 Rate Limit 헤더 생성
 * 클라이언트가 현재 제한 상태를 파악할 수 있도록 도움
 */

/**
 * Rate Limit 헤더 생성 함수
 *
 * HTTP 응답에 포함할 Rate Limit 정보 헤더를 생성합니다.
 *
 * 생성되는 헤더:
 * - X-RateLimit-Limit: 최대 허용 요청 수
 * - X-RateLimit-Remaining: 남은 요청 수
 * - X-RateLimit-Reset: 제한 초기화 시간 (ISO 8601)
 * - Retry-After: 재시도 대기 시간 (초) - 제한 초과 시에만
 *
 * @param result RateLimitResult - Rate Limit 체크 결과
 * @returns HTTP 헤더 객체
 *
 * 사용 예시:
 * ```typescript
 * const result = apiRateLimiter.checkLimit(clientIP);
 * const headers = createRateLimitHeaders(result);
 *
 * return new Response(data, {
 *   status: result.allowed ? 200 : 429,
 *   headers: {
 *     ...headers,
 *     'Content-Type': 'application/json'
 *   }
 * });
 * ```
 */
export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    // 최대 허용 요청 수 (환경변수 기반)
    "X-RateLimit-Limit": result.remaining.toString(),

    // 남은 요청 수 (실시간 계산)
    "X-RateLimit-Remaining": result.remaining.toString(),

    // 제한 초기화 시간 (ISO 8601 형식)
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
  };

  // 제한 초과 시에만 Retry-After 헤더 추가
  if (!result.allowed && result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}
