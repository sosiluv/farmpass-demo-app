import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    throwBusinessError("MISSING_REQUIRED_FIELDS", {
      missingFields: ["email"],
      operation: "check_email",
    });
  }
  let existingUser = null;

  try {
    try {
      existingUser = await prisma.profiles.findFirst({
        where: { email: email },
        select: { id: true },
      });
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "email",
        },
        error
      );
    }

    return NextResponse.json({
      success: true,
      isDuplicate: !!existingUser,
      message: existingUser ? "이미 사용 중인 이메일 주소입니다." : "",
    });
  } catch (error) {
    devLog.error("Email check error:", error);

    // 시스템 에러 로깅
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "EMAIL_CHECK_FAILED",
      LOG_MESSAGES.EMAIL_CHECK_FAILED(errorMessage),
      "error",
      { id: "", email: email }, // 시스템 사용자로 처리
      "system",
      email, // 이메일을 resourceId로 사용
      {
        action_type: "auth_event",
        event: "email_check_failed",
        error_message: errorMessage,
        email: email,
      },
      request
    );

    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error, {
      operation: "check_email",
      email: email,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
