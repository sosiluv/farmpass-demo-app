import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
} from "@/lib/utils/error/errorUtil";

// UptimeRobot 상태 데이터 패치
async function fetchUptimeStatus() {
  const uptimeRobotApiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!uptimeRobotApiKey) {
    return {
      success: false,
      error: "UPTIMEROBOT_API_KEY_NOT_CONFIGURED",
      message: "UptimeRobot API 키가 설정되지 않았습니다.",
      details: "환경 변수 UPTIMEROBOT_API_KEY를 설정해주세요.",
      monitors: [],
    };
  }
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        api_key: uptimeRobotApiKey,
        format: "json",
        logs: 1,
        custom_uptime_ratios: "30",
      }),
    });
    if (!res.ok) {
      throw new Error(
        `UptimeRobot API 응답 오류: ${res.status} ${res.statusText}`
      );
    }
    const data = await res.json();
    if (data.stat !== "ok") {
      throw new Error(data.error?.message || "UptimeRobot API 에러");
    }
    return {
      success: true,
      stat: data.stat,
      monitors: data.monitors || [],
    };
  } catch (error) {
    return {
      success: false,
      error: "UPTIMEROBOT_API_ERROR",
      message: "UptimeRobot API 호출에 실패했습니다.",
      details: error instanceof Error ? error.message : "Unknown error",
      monitors: [],
    };
  }
}

export async function GET(request: NextRequest) {
  let user = null;

  try {
    const authResult = await requireAuth(true); // admin 권한 필수
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;
    const uptimeStatus = await fetchUptimeStatus();
    return NextResponse.json(uptimeStatus);
  } catch (error) {
    // 모니터링 업타임 상태 조회 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "MONITORING_UPTIME_FAILED",
      LOG_MESSAGES.MONITORING_UPTIME_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "monitoring_uptime",
      {
        action_type: "monitoring_event",
        event: "uptime_check_failed",
        error_message: errorMessage,
        user_id: user?.id,
        user_email: user?.email,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_uptime_status",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
