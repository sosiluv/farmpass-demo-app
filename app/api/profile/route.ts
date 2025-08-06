import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

// PATCH: 프로필 정보 수정
export async function PATCH(request: NextRequest) {
  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    const data = await request.json();

    try {
      await prisma.profiles.update({
        where: {
          id: user.id,
        },
        data: {
          ...data,
          updated_at: new Date(),
        },
      });
    } catch (updateError) {
      throwBusinessError(
        "GENERAL_UPDATE_FAILED",
        {
          resourceType: "profile",
        },
        updateError
      );
    }

    await createSystemLog(
      "PROFILE_UPDATED",
      LOG_MESSAGES.PROFILE_UPDATED(user.email || user.id),
      "info",
      { id: user.id, email: user.email || "" },
      "user",
      user.id,
      {
        action_type: "profile_event",
        event: "profile_updated",
        target_user_id: user.id,
        updated_fields: Object.keys(data),
      },
      request
    );
    return NextResponse.json(
      {
        success: true,
        message: "프로필 정보가 성공적으로 저장되었습니다.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "PROFILE_UPDATE_FAILED",
      LOG_MESSAGES.PROFILE_UPDATE_FAILED(user?.id || "unknown", errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "user",
      user?.id,
      {
        action_type: "profile_event",
        event: "profile_update_failed",
        error_message: errorMessage,
        target_user_id: user?.id,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "update_profile",
      userId: user?.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
