import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logSystemWarning } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

// 시스템 헬스체크 데이터 패치
async function fetchHealthCheck(baseUrl: string) {
  const res = await fetch(new URL("/api/health", baseUrl), {
    cache: "no-store",
  });
  return res.json();
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(true); // admin 권한 필수
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const host = headers().get("host") || "localhost:3000";
  const baseUrl = `${
    process.env.NODE_ENV === "production" ? "https" : "http"
  }://${host}`;
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const healthCheck = await fetchHealthCheck(baseUrl);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      health: healthCheck,
    });
  } catch (error) {
    await logSystemWarning(
      "MONITORING_HEALTH_CHECK_FAILED",
      "헬스 체크 데이터 조회 실패",
      { ip: clientIP, userAgent },
      {
        success: false,
        error: "HEALTH_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      }
    );
    return NextResponse.json(
      {
        success: false,
        error: "HEALTH_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
