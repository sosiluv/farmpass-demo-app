import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { logApiError } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

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
    const { type = "system_logs" } = body; // "system_logs" 또는 "all"

    let result;

    if (type === "all") {
      // 방문자 데이터 정리
      let visitorData;
      try {
        const { data, error: visitorError } = await supabase.rpc(
          "auto_cleanup_expired_visitor_entries"
        );

        if (visitorError) {
          devLog.error("[LOG-CLEANUP] 방문자 데이터 정리 오류:", visitorError);
          throw new Error(
            `Visitor data cleanup failed: ${visitorError.message}`
          );
        }
        visitorData = data;
      } catch (visitorError: any) {
        devLog.error(
          "[LOG-CLEANUP] Visitor data cleanup failed:",
          visitorError
        );
        return NextResponse.json(
          {
            success: false,
            error: "VISITOR_CLEANUP_FAILED",
            message: "방문자 데이터 정리에 실패했습니다.",
          },
          { status: 500 }
        );
      }

      // 시스템 로그 정리
      let logData;
      try {
        const { data, error: logError } = await supabase.rpc(
          "auto_cleanup_expired_system_logs"
        );

        if (logError) {
          devLog.error("[LOG-CLEANUP] 시스템 로그 정리 오류:", logError);
          throw new Error(`System log cleanup failed: ${logError.message}`);
        }
        logData = data;
      } catch (logError: any) {
        devLog.error("[LOG-CLEANUP] System log cleanup failed:", logError);
        return NextResponse.json(
          {
            success: false,
            error: "SYSTEM_LOG_CLEANUP_FAILED",
            message: "시스템 로그 정리에 실패했습니다.",
          },
          { status: 500 }
        );
      }

      // 결과 통합
      result = [
        ...(Array.isArray(visitorData) ? visitorData : [visitorData]),
        ...(Array.isArray(logData) ? logData : [logData]),
      ];

      devLog.log("[LOG-CLEANUP] 통합 정리 결과:", {
        visitorData,
        logData,
        result,
      });
    } else {
      // 시스템 로그만 정리
      let data;
      try {
        const { data: cleanupData, error } = await supabase.rpc(
          "auto_cleanup_expired_system_logs"
        );

        devLog.log("[LOG-CLEANUP] 로그 정리 결과:", {
          data: cleanupData,
          error,
        });

        if (error) {
          throw new Error(`System log cleanup failed: ${error.message}`);
        }
        data = cleanupData;
      } catch (error: any) {
        devLog.error("[LOG-CLEANUP] System log cleanup failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: "SYSTEM_LOG_CLEANUP_FAILED",
            message: "시스템 로그 정리에 실패했습니다.",
          },
          { status: 500 }
        );
      }

      result = data;
    }

    // 삭제된 개수 계산
    let totalDeleted = 0;
    if (type === "all") {
      // 모든 데이터 정리인 경우
      if (Array.isArray(result)) {
        totalDeleted = result.reduce((sum: number, item: any) => {
          return sum + (item?.deleted_count || 0);
        }, 0);
      }
    } else {
      // 시스템 로그만 정리인 경우
      if (result && typeof result === "object" && "deleted_count" in result) {
        totalDeleted = result.deleted_count || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalDeleted}개의 데이터가 정리되었습니다.`,
      results: result,
    });
  } catch (error) {
    devLog.error("[LOG-CLEANUP] 로그 정리 API 오류:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/admin/logs/cleanup",
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
        error: "LOG_CLEANUP_FAILED",
        message: "로그 정리에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    // 시스템 설정 조회
    const settings = await getSystemSettings();
    // 기본값 설정
    const effectiveLogRetentionDays = settings.logRetentionDays || 90;
    const effectiveVisitorRetentionDays =
      settings.visitorDataRetentionDays || 1095;

    const logCutoffDate = new Date();
    logCutoffDate.setDate(logCutoffDate.getDate() - effectiveLogRetentionDays);

    const visitorCutoffDate = new Date();
    visitorCutoffDate.setDate(
      visitorCutoffDate.getDate() - effectiveVisitorRetentionDays
    );

    // 만료된 로그 개수 조회
    const expiredLogsCount = await prisma.system_logs.count({
      where: {
        created_at: {
          lt: logCutoffDate,
        },
      },
    });

    // 만료된 방문자 데이터 개수 조회
    const expiredVisitorsCount = await prisma.visitor_entries.count({
      where: {
        visit_datetime: {
          lt: visitorCutoffDate,
        },
      },
    });

    devLog.log("[LOG-CLEANUP] 데이터 개수 조회 완료:", {
      expiredLogsCount,
      expiredVisitorsCount,
    });

    const result = {
      settings: {
        logRetentionDays: effectiveLogRetentionDays,
        visitorDataRetentionDays: effectiveVisitorRetentionDays,
      },
      expiredData: {
        systemLogs: {
          count: expiredLogsCount || 0,
          cutoffDate: logCutoffDate.toISOString(),
        },
        visitorEntries: {
          count: expiredVisitorsCount || 0,
          cutoffDate: visitorCutoffDate.toISOString(),
        },
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    devLog.error("[LOG-CLEANUP] 정리 상태 조회 API 오류:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/admin/logs/cleanup",
      "GET",
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
        error: "CLEANUP_STATUS_QUERY_FAILED",
        message: "정리 상태 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
