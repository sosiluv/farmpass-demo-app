import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { logApiError } from "@/lib/utils/logging/system-log";
import { prisma } from "@/lib/prisma";
import { sendSupabaseBroadcast } from "@/lib/supabase/broadcast";

// PATCH: 프로필 정보 수정
export async function PATCH(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;

  try {
    const data = await request.json();

    const updatedProfile = await prisma.profiles.update({
      where: {
        id: user.id,
      },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    // 🔥 프로필 수정 실시간 브로드캐스트
    await sendSupabaseBroadcast({
      channel: "profile_updates",
      event: "profile_updated",
      payload: {
        eventType: "UPDATE",
        new: updatedProfile,
        old: null,
        table: "profiles",
        schema: "public",
      },
    });

    await createSystemLog(
      "PROFILE_UPDATE",
      `프로필 정보 수정: ${Object.keys(data).length}개 필드 수정`,
      "info",
      user.id,
      "user",
      user.id,
      {
        target_user_id: user.id,
        action_type: "profile_info_update",
        updated_fields: Object.keys(data),
        status: "success",
      },
      user.email,
      clientIP,
      userAgent
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
    devLog.error("[API] PROFILE_UPDATE 실패:", error);

    // API 에러 로깅
    await logApiError(
      "/api/profile",
      "PATCH",
      error instanceof Error ? error : String(error),
      user?.id,
      {
        ip: clientIP,
        userAgent,
      }
    );

    await createSystemLog(
      "PROFILE_UPDATE_FAILED",
      `프로필 정보 수정 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      user?.id,
      "user",
      user?.id,
      {
        target_user_id: user?.id,
        action_type: "profile_info_update",
        error: error instanceof Error ? error.message : String(error),
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("[API] PROFILE_UPDATE 로그 실패:", logError)
    );
    return NextResponse.json(
      {
        success: false,
        error: "PROFILE_UPDATE_FAILED",
        message: "프로필 정보 수정에 실패했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
