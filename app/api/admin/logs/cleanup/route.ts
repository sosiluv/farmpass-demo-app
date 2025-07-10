import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { logApiError } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

export async function POST(request: NextRequest) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    devLog.log("로그 정리 API 시작");

    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const supabase = await createClient();
    devLog.log("Supabase 클라이언트 생성 완료");

    const body = await request.json();
    const { type = "system_logs" } = body; // "system_logs" 또는 "all"

    devLog.log("정리 타입:", type);

    let result;

    if (type === "all") {
      devLog.log("모든 데이터 정리 시작");

      // 방문자 데이터 정리
      devLog.log("방문자 데이터 정리 시작");
      const { data: visitorData, error: visitorError } = await supabase.rpc(
        "auto_cleanup_expired_visitor_entries"
      );

      if (visitorError) {
        devLog.error("방문자 데이터 정리 오류:", visitorError);
        throw new Error(`방문자 데이터 정리 실패: ${visitorError.message}`);
      }

      // 시스템 로그 정리
      devLog.log("시스템 로그 정리 시작");
      const { data: logData, error: logError } = await supabase.rpc(
        "auto_cleanup_expired_system_logs"
      );

      if (logError) {
        devLog.error("시스템 로그 정리 오류:", logError);
        throw new Error(`시스템 로그 정리 실패: ${logError.message}`);
      }

      // 결과 통합
      result = [
        ...(Array.isArray(visitorData) ? visitorData : [visitorData]),
        ...(Array.isArray(logData) ? logData : [logData]),
      ];

      devLog.log("통합 정리 결과:", { visitorData, logData, result });
    } else {
      devLog.log("시스템 로그 정리 시작");
      // 시스템 로그만 정리
      const { data, error } = await supabase.rpc(
        "auto_cleanup_expired_system_logs"
      );

      devLog.log("로그 정리 결과:", { data, error });

      if (error) {
        throw new Error(`시스템 로그 정리 실패: ${error.message}`);
      }

      result = data;
    }

    devLog.log("정리 작업 완료, 응답 반환");
    return NextResponse.json({
      success: true,
      message: "정리 작업이 완료되었습니다.",
      results: result,
    });
  } catch (error) {
    devLog.error("로그 정리 API 오류:", error);

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
        error: "로그 정리 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
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
    devLog.log("정리 상태 조회 API 시작");

    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const supabase = await createClient();

    // 시스템 설정 조회
    const settings = await getSystemSettings();
    devLog.log("settings", settings);
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

    devLog.log("날짜 기준:", {
      logCutoffDate: logCutoffDate.toISOString(),
      visitorCutoffDate: visitorCutoffDate.toISOString(),
    });

    // 만료된 로그 개수 조회
    const { count: expiredLogsCount } = await supabase
      .from("system_logs")
      .select("*", { count: "exact", head: true })
      .lt("created_at", logCutoffDate.toISOString());

    // 만료된 방문자 데이터 개수 조회
    const { count: expiredVisitorsCount } = await supabase
      .from("visitor_entries")
      .select("*", { count: "exact", head: true })
      .lt("visit_datetime", visitorCutoffDate.toISOString());

    devLog.log("데이터 개수 조회 완료:", {
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

    devLog.log("정리 상태 조회 성공");
    return NextResponse.json(result);
  } catch (error) {
    devLog.error("정리 상태 조회 API 오류:", error);

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
        error: "정리 상태 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
