import { NextRequest, NextResponse } from "next/server";
import { logSystemWarning } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

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
  const authResult = await requireAuth(true); // admin 권한 필수
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const uptimeStatus = await fetchUptimeStatus();
    return NextResponse.json(uptimeStatus);
  } catch (error) {
    await logSystemWarning(
      "MONITORING_UPTIME_FAILED",
      "업타임 상태 조회 실패",
      { ip: clientIP, userAgent },
      {
        success: false,
        error: "UPTIME_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      }
    );
    return NextResponse.json(
      {
        success: false,
        error: "UPTIME_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
