import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logApiError, createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

export async function POST(request: NextRequest) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const supabase = await createClient();

    const body = await request.json();
    const { action, logId, beforeCount } = body;

    let result;
    let logMessage = "";

    switch (action) {
      case "delete_single":
        // 개별 로그 삭제
        const { error: deleteError } = await supabase
          .from("system_logs")
          .delete()
          .eq("id", logId);

        if (deleteError) throw deleteError;

        result = { deleted: true, logId };
        logMessage = `관리자가 개별 시스템 로그를 삭제했습니다 (로그 ID: ${logId})`;
        break;

      case "delete_all":
        // 전체 로그 삭제
        const { error: deleteAllError } = await supabase
          .from("system_logs")
          .delete()
          .not("id", "is", null);

        if (deleteAllError) throw deleteAllError;

        result = { deleted: true, count: beforeCount };
        logMessage = `관리자가 모든 시스템 로그를 완전히 삭제했습니다 (총 ${beforeCount}개 삭제)`;
        break;

      case "delete_old":
        // 30일 이전 로그 삭제
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: oldLogsCount, error: countError } = await supabase
          .from("system_logs")
          .select("*", { count: "exact", head: true })
          .lt("created_at", thirtyDaysAgo.toISOString());

        if (countError) throw countError;

        if (!oldLogsCount) {
          result = { deleted: false, count: 0 };
          logMessage = "삭제할 30일 이전 로그가 없습니다.";
        } else {
          const { error: deleteOldError } = await supabase
            .from("system_logs")
            .delete()
            .lt("created_at", thirtyDaysAgo.toISOString());

          if (deleteOldError) throw deleteOldError;

          result = { deleted: true, count: oldLogsCount };
          logMessage = `관리자가 30일 이전 시스템 로그를 삭제했습니다 (총 ${oldLogsCount}개 삭제)`;
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "UNSUPPORTED_DELETE_OPERATION",
            message: "지원하지 않는 삭제 작업입니다.",
          },
          { status: 400 }
        );
    }

    // 삭제 작업 로그 기록
    await createSystemLog(
      "LOG_DELETE",
      logMessage,
      "info",
      user.id,
      "system",
      undefined,
      {
        action: action,
        user_email: user.email,
        deleted_count: result.count || 1,
        log_id: logId,
        timestamp: new Date().toISOString(),
      },
      user.email,
      clientIP,
      userAgent
    );

    devLog.log("로그 삭제 작업 완료:", result);

    // 작업 유형에 따른 구체적인 메시지 생성
    let successMessage = "";
    switch (action) {
      case "delete_single":
        successMessage = "로그가 삭제되었습니다.";
        break;
      case "delete_all":
        successMessage = `${beforeCount}개의 로그가 삭제되었습니다.`;
        break;
      case "delete_old":
        successMessage =
          result.count > 0
            ? `${result.count}개의 오래된 로그가 삭제되었습니다.`
            : "삭제할 오래된 로그가 없습니다.";
        break;
      default:
        successMessage = "로그 삭제가 완료되었습니다.";
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      result,
    });
  } catch (error) {
    devLog.error("로그 삭제 API 오류:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/admin/logs/delete",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "LOG_DELETE_FAILED",
        message: "로그 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
