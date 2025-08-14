import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import type { ResetPasswordRequestFormData } from "@/lib/utils/validation/auth-validation";
import { resetPasswordRequestFormSchema } from "@/lib/utils/validation/auth-validation";

export async function POST(request: NextRequest) {
  let email: string | undefined;
  let userData;

  try {
    const body: ResetPasswordRequestFormData = await request.json();

    // ZOD 스키마로 검증
    const validation = resetPasswordRequestFormSchema.safeParse(body);
    if (!validation.success) {
      throwBusinessError("INVALID_FORM_DATA", {
        errors: validation.error.errors,
        formType: "user",
      });
    }

    const { email: validatedEmail } = validation.data;
    email = validatedEmail;

    // 서버용 Supabase 클라이언트 생성
    const supabase = await createClient();

    // profiles 테이블에서 사용자 정보 가져오기
    try {
      userData = await prisma.profiles.findUnique({
        where: { email },
        select: { id: true },
      });
    } catch (error) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "user",
        },
        error
      );
    }

    // Supabase Auth를 통한 비밀번호 재설정 이메일 전송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password/confirm`,
    });

    if (error) {
      // 실패 로그 기록 (error 레벨로 변경) - 템플릿 활용
      await createSystemLog(
        "PASSWORD_RESET_REQUEST_FAILED",
        LOG_MESSAGES.PASSWORD_RESET(email),
        "error",
        userData?.id ? { id: userData.id, email: email } : undefined,
        "auth",
        userData?.id,
        {
          action_type: "auth_event",
          event: "password_reset_request_failed",
          error_message: error.message,
        },
        request
      );

      // Supabase Auth 에러를 표준화된 에러 코드로 매핑
      const result = getErrorResultFromRawError(error, {
        operation: "reset_password_email",
        email: email,
      });

      return NextResponse.json(makeErrorResponseFromResult(result), {
        status: result.status,
      });
    }

    // 성공 로그 기록 - 템플릿 활용
    await createSystemLog(
      "PASSWORD_RESET_REQUESTED",
      LOG_MESSAGES.PASSWORD_RESET(email),
      "info",
      userData?.id ? { id: userData.id, email: email } : undefined,
      "auth",
      userData?.id,
      {
        action_type: "auth_event",
        event: "password_reset",
        email: email,
      },
      request
    );

    return NextResponse.json(
      {
        success: true,
        message: "비밀번호 재설정 이메일이 전송되었습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    // 시스템 에러 로그 기록 (error 레벨로 변경) - 템플릿 활용
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "PASSWORD_RESET_SYSTEM_ERROR",
      LOG_MESSAGES.PASSWORD_RESET_SYSTEM_ERROR(
        email || "unknown",
        errorMessage
      ),
      "error",
      userData?.id ? { id: userData.id, email: email || "unknown" } : undefined,
      "auth",
      userData?.id,
      {
        action_type: "auth_event",
        event: "password_reset_system_error",
        error_message: errorMessage,
        email: email || "unknown",
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "reset_password",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
