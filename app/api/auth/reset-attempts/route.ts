import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let email: string | undefined;

  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const { email: requestEmail, reason } = await request.json();
    email = requestEmail;

    if (!email) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["email"],
        operation: "reset_attempts",
      });
    }

    // 현재 상태 확인 (로그를 위해)
    let currentProfile;
    try {
      currentProfile = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true, login_attempts: true, last_failed_login: true },
      });
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "user",
        },
        error
      );
    }

    // 이미 잠금이 아닌 경우
    if (!currentProfile || currentProfile.login_attempts === 0) {
      return NextResponse.json({
        success: true,
        message: "계정이 이미 잠금 해제되어 있습니다.",
      });
    }

    // 로그인 시도 횟수 초기화
    try {
      await prisma.$executeRaw`
        UPDATE profiles
        SET login_attempts = 0,
            last_failed_login = NULL,
            last_login_attempt = NULL
        WHERE email = ${email}
      `;
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_UPDATE_FAILED",
        {
          resourceType: "loginAttempts",
        },
        error
      );
    }

    // 수동 잠금 해제 로그 기록 - 템플릿 활용
    await createSystemLog(
      "LOGIN_ATTEMPTS_RESET",
      LOG_MESSAGES.LOGIN_ATTEMPTS_RESET(email),
      "info",
      { id: currentProfile.id, email: email },
      "auth",
      undefined,
      {
        action_type: "auth_event",
        event: "login_attempts_reset",
        email: email,
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: "계정 잠금이 해제되었습니다!",
    });
  } catch (error) {
    devLog.error("Reset login attempts error:", error);

    // 에러 로그 기록 (error 레벨로 변경) - 템플릿 활용
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await createSystemLog(
      "LOGIN_ATTEMPTS_RESET_ERROR",
      LOG_MESSAGES.LOGIN_ATTEMPTS_RESET_ERROR(email || "unknown", errorMessage),
      "error",
      undefined,
      "auth",
      undefined,
      {
        action_type: "auth_event",
        event: "login_attempts_reset_error",
        email: email || "unknown",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "reset_attempts",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
