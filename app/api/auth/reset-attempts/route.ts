import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/server/auth-utils";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const { email, reason } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_EMAIL",
          message: "이메일 주소가 필요합니다.",
        },
        { status: 400 }
      );
    }

    // 현재 상태 확인 (로그를 위해)
    const currentProfile = await prisma.profiles.findUnique({
      where: { email },
      select: { id: true, login_attempts: true, last_failed_login: true },
    });

    // 이미 잠금이 아닌 경우
    if (!currentProfile || currentProfile.login_attempts === 0) {
      return NextResponse.json({
        success: true,
        message: "Account is already unlocked.",
      });
    }

    // 로그인 시도 횟수 초기화
    await prisma.$executeRaw`
      UPDATE profiles
      SET login_attempts = 0,
          last_failed_login = NULL,
          last_login_attempt = NULL
      WHERE email = ${email}
    `;

    // 수동 잠금 해제 로그 기록
    await createSystemLog(
      "LOGIN_ATTEMPTS_RESET",
      `로그인 시도 횟수 수동 초기화: ${email} (이전 시도: ${currentProfile.login_attempts}회)`,
      "info",
      currentProfile.id,
      "auth",
      undefined,
      {
        previous_attempts: currentProfile.login_attempts,
        reset_reason: reason || "manual_reset",
        action_type: "security_event",
        reset_at: new Date().toISOString(),
        admin_id: user.id,
        admin_action: true,
      },
      email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log attempts reset:", logError)
    );

    return NextResponse.json({
      success: true,
      message: "Account lock has been removed!",
    });
  } catch (err) {
    devLog.error("Reset login attempts error:", err);

    const error = err as Error;

    // 에러 로그 기록 (error 레벨로 변경)
    await createSystemLog(
      "LOGIN_ATTEMPTS_RESET_ERROR",
      `로그인 시도 횟수 초기화 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
      undefined,
      "auth",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        error_type: error.constructor?.name || "Unknown",
        action_type: "system_error",
        timestamp: new Date().toISOString(),
      },
      undefined,
      clientIP,
      userAgent
    ).catch((logError) => devLog.error("Failed to log reset error:", logError));

    return NextResponse.json(
      {
        success: false,
        error: "RESET_ATTEMPTS_ERROR",
        message: "로그인 시도 횟수 초기화 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
