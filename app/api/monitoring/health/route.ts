import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
} from "@/lib/utils/error/errorUtil";

// 시스템 헬스체크 데이터 패치
async function fetchHealthCheck(baseUrl: string) {
  const res = await fetch(new URL("/api/health", baseUrl), {
    cache: "no-store",
  });
  return res.json();
}

export async function GET(request: NextRequest) {
  let user = null;

  try {
    const authResult = await requireAuth(true); // admin 권한 필수
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;
    const host = headers().get("host") || "localhost:3000";
    const baseUrl = `${
      process.env.NODE_ENV === "production" ? "https" : "http"
    }://${host}`;

    const healthCheck = await fetchHealthCheck(baseUrl);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      health: healthCheck,
    });
  } catch (error) {
    // 모니터링 헬스 체크 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "MONITORING_HEALTH_CHECK_FAILED",
      LOG_MESSAGES.MONITORING_HEALTH_CHECK_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      undefined,
      {
        action_type: "monitoring_event",
        event: "health_check_failed",
        error_message: errorMessage,
        user_id: user?.id,
        user_email: user?.email,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_health_check",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
