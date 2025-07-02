import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAuthLog,
  logSecurityError,
  logApiError,
} from "@/lib/utils/logging/system-log";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
  logDatabasePerformance,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  const monitor = new PerformanceMonitor("auth_login_failed");

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const { email } = await request.json();

    if (!email) {
      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/auth/login-failed",
        method: "POST",
        duration_ms: duration,
        status_code: 400,
        response_size: 0,
      });

      return NextResponse.json(
        { error: "이메일 주소가 필요합니다." },
        { status: 400 }
      );
    }

    // 시스템 설정에서 최대 로그인 시도 횟수 가져오기
    const settings = await getSystemSettings();
    const suspiciousThreshold = Math.floor(settings.maxLoginAttempts / 2); // 최대 시도 횟수의 절반을 의심스러운 시도로 간주

    // 프로필 업데이트
    const dbMonitor = new PerformanceMonitor("auth_profile_update");
    const profile = await prisma.profiles.update({
      where: { email },
      data: {
        login_attempts: {
          increment: 1,
        },
        last_failed_login: new Date(),
      },
    });
    const dbDuration = await dbMonitor.finish();

    await logDatabasePerformance(
      {
        query: "UPDATE profiles SET login_failed_count",
        table: "profiles",
        duration_ms: dbDuration,
        row_count: 1,
      },
      profile.id,
      {
        ip: clientIP,
        email: email,
        userAgent: userAgent,
      }
    );

    // 로그인 실패 로그 생성
    await createAuthLog(
      "LOGIN_FAILED",
      `로그인 실패: ${email}, 로그인 시도 횟수: ${profile.login_attempts || 0}`,
      email,
      profile.id,
      {
        attempts: profile.login_attempts || 0,
        ip: clientIP,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      },
      {
        ip: clientIP,
        email: email,
        userAgent: userAgent,
      }
    );

    // 의심스러운 로그인 시도 감지
    if ((profile.login_attempts || 0) >= suspiciousThreshold) {
      await logSecurityError(
        "SUSPICIOUS_LOGIN_ATTEMPTS",
        `의심스러운 로그인 시도 감지: ${email} (${profile.login_attempts}회 시도)`,
        profile.id,
        clientIP,
        userAgent
      );
    }

    const duration = await monitor.finish();
    const responseData = { attempts: profile.login_attempts || 0 };
    await logApiPerformance({
      endpoint: "/api/auth/login-failed",
      method: "POST",
      duration_ms: duration,
      status_code: 200,
      response_size: JSON.stringify(responseData).length,
    });

    return NextResponse.json(responseData);
  } catch (err) {
    const duration = await monitor.finish();
    devLog.error("Login failure recording error:", err);

    const error = err as Error;

    await logApiError("/api/auth/login-failed", "POST", error, undefined, {
      ip: clientIP,
      userAgent: userAgent,
    });
    await logApiPerformance(
      {
        endpoint: "/api/auth/login-failed",
        method: "POST",
        duration_ms: duration,
        status_code: 500,
        response_size: 0,
      },
      undefined,
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    );

    // DB 업데이트 실패 로그 기록
    await createAuthLog(
      "LOGIN_FAILURE_DB_ERROR",
      `로그인 실패 기록 중 DB 에러: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      undefined,
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        error_type: error.constructor?.name || "Unknown",
        action_type: "database_operation",
        timestamp: new Date().toISOString(),
      },
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    ).catch((logError) => devLog.error("Failed to log DB error:", logError));

    return NextResponse.json(
      { error: "로그인 실패 기록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
