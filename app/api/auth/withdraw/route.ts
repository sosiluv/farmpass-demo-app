import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  // 인증 및 권한 확인 (본인만 가능)
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;

  try {
    // 1. auth.users에서 유저 삭제 (서비스 롤 키 사용)
    const serviceRoleSupabase = createServiceRoleClient();
    const { error } = await serviceRoleSupabase.auth.admin.deleteUser(user.id);
    if (error) {
      devLog.error("회원탈퇴 실패:", error);
      await createSystemLog(
        "WITHDRAW_FAILED",
        LOG_MESSAGES.WITHDRAW_FAILED(user.email || "unknown", error.message),
        "error",
        { id: user.id, email: user.email || "" },
        "user",
        undefined,
        {
          action_type: "auth_event",
          event: "withdraw_failed",
          error_message: error.message,
        },
        request
      );
      // Supabase Auth 에러를 표준화된 에러 코드로 매핑
      const result = getErrorResultFromRawError(error, {
        operation: "withdraw_user",
        userId: user.id,
      });

      return NextResponse.json(makeErrorResponseFromResult(result), {
        status: result.status,
      });
    }

    // 시스템 로그 기록
    await createSystemLog(
      "WITHDRAW_SUCCESS",
      LOG_MESSAGES.WITHDRAW_SUCCESS(user.email || "unknown"),
      "info",
      { id: user.id, email: user.email || "" },
      "user",
      undefined,
      {
        action_type: "auth_event",
        event: "withdraw_success",
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: "회원탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "WITHDRAW_FAILED",
      LOG_MESSAGES.WITHDRAW_FAILED(user.email || "unknown", errorMessage),
      "error",
      { id: user.id, email: user.email || "" },
      "user",
      undefined,
      {
        action_type: "auth_event",
        event: "withdraw_failed",
        error_message: errorMessage,
      }
    );
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "withdraw",
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
