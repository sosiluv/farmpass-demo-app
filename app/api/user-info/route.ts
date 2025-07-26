import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
  logApiError,
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
    await createSystemLog(
      "IP_ADDRESS_QUERY",
      `클라이언트 정보 조회: IP ${ip}`,
      "info",
      undefined, // 인증되지 않은 요청일 수 있음
      "system",
      undefined,
      {
        client_ip: ip,
        user_agent: userAgent,
        request_source: "user-info-api",
        headers_checked: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
        action_type: "user_info",
      },
      undefined,
      ip,
      userAgent
    );

    return NextResponse.json(
      {
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error getting user info:", error);

    // API 에러 로깅
    await logApiError(
      "/api/user-info",
      "GET",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: getClientIP(request),
        userAgent: getUserAgent(request),
      }
    );

    // IP 조회 실패 로그 기록
    await createSystemLog(
      "IP_ADDRESS_QUERY_FAILED",
      `클라이언트 정보 조회 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      undefined,
      "system",
      undefined,
      {
        error_message: error instanceof Error ? error.message : String(error),
        request_source: "user-info-api",
        action_type: "user_info",
      },
      undefined,
      getClientIP(request),
      getUserAgent(request)
    );

    statusCode = 500;

    return NextResponse.json(
      {
        success: false,
        error: "USER_INFO_FETCH_FAILED",
        message: "사용자 정보 조회에 실패했습니다.",
      },
      { status: 500 }
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
