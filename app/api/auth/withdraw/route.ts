import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  // 인증 및 권한 확인 (본인만 가능)
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const user = authResult.user;
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 1. auth.users에서 유저 삭제 (서비스 롤 키 사용)
    const serviceRoleSupabase = createServiceRoleClient();
    const { error } = await serviceRoleSupabase.auth.admin.deleteUser(user.id);
    if (error) {
      devLog.error("회원탈퇴 실패:", error);
      await createSystemLog(
        "WITHDRAW_FAILED",
        `회원탈퇴 실패: ${error.message}`,
        "error",
        user.id,
        "user",
        undefined,
        {
          error_message: error.message,
          action_type: "withdraw",
        },
        user.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        {
          success: false,
          error: error.message || "WITHDRAW_ERROR",
          message: "회원탈퇴에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 2. 연관 데이터도 삭제 (예: profiles)
    await serviceRoleSupabase.from("profiles").delete().eq("id", user.id);

    // 시스템 로그 기록
    await createSystemLog(
      "WITHDRAW_SUCCESS",
      `회원탈퇴 성공: ${user.email}`,
      "info",
      user.id,
      "user",
      undefined,
      {
        action_type: "withdraw",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "회원탈퇴가 완료되었습니다.",
    });
  } catch (error: any) {
    devLog.error("회원탈퇴 API 오류:", error);
    await logApiError("/api/auth/withdraw", "POST", error, user.id, {
      ip: clientIP,
      userAgent,
    });
    return NextResponse.json(
      {
        success: false,
        error: "WITHDRAW_ERROR",
        message: "회원탈퇴 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
