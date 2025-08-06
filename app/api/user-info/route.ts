import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
} from "@/lib/utils/error/errorUtil";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 통일된 IP 추출 로직 사용
    const ip = getClientIP(request);
    const userAgent = getUserAgent(request);

    // IP 주소 조회 로그 기록 (보안 추적용)
    await createSystemLog(
      "IP_ADDRESS_QUERY",
      LOG_MESSAGES.IP_ADDRESS_QUERY(ip),
      "info",
      undefined, // 인증되지 않은 요청일 수 있음
      "system",
      undefined,
      {
        action_type: "ip_address_query_event",
        event: "ip_address_query",
        request_source: "user-info-api",
        headers_checked: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
      },
      request
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
    // 사용자 정보 조회 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "IP_ADDRESS_QUERY_FAILED",
      LOG_MESSAGES.IP_ADDRESS_QUERY_FAILED(errorMessage),
      "error",
      undefined,
      "system",
      undefined,
      {
        action_type: "ip_address_query_event",
        event: "ip_address_query_failed",
        request_source: "user-info-api",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_user_info",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
