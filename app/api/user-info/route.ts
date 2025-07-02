import { NextRequest, NextResponse } from "next/server";
import { logUserActivity } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 성능 모니터링 시작
  const performanceMonitor = new PerformanceMonitor("user_info_api", {
    endpoint: "/api/user-info",
    method: "GET",
  });

  let statusCode = 200;

  try {
    // 통일된 IP 추출 로직 사용
    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    // IP 주소 조회 로그 기록 (보안 추적용)
    await logUserActivity(
      "IP_ADDRESS_QUERY",
      `클라이언트 정보 조회: IP ${ip}`,
      undefined, // 인증되지 않은 요청일 수 있음
      {
        client_ip: ip,
        user_agent: userAgent,
        request_source: "user-info-api",
        headers_checked: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
      },
      { ip, userAgent } // context 추가
    );

    return NextResponse.json({
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    devLog.error("Error getting user info:", error);

    // IP 조회 실패 로그 기록
    await logUserActivity(
      "IP_ADDRESS_QUERY_FAILED",
      `클라이언트 정보 조회 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      undefined,
      {
        error_message: error instanceof Error ? error.message : String(error),
        request_source: "user-info-api",
      },
      { ip: getClientIP(request), userAgent: getUserAgent(request) } // context 추가
    );

    statusCode = 500;

    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: statusCode }
    );
  } finally {
    // 성능 모니터링 종료 및 로깅
    const duration = await performanceMonitor.finish(100); // 100ms 임계값

    // API 성능 로깅
    await logApiPerformance(
      {
        endpoint: "/api/user-info",
        method: "GET",
        duration_ms: duration,
        status_code: statusCode,
        response_size: 0, // 실제로는 응답 크기를 계산해야 함
      },
      undefined,
      { ip: getClientIP(request), userAgent: getUserAgent(request) }
    );
  }
}
