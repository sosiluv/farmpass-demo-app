import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import {
  getErrorResultFromRawError,
  mapRawErrorToCode,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

/**
 * RPC 함수 실행을 위한 헬퍼 함수
 * Supabase RPC 에러를 표준화된 에러로 변환
 */
async function executeRPC<T>(
  rpcFunction: () => Promise<{ data: T; error: any }>
): Promise<T> {
  try {
    const { data, error } = await rpcFunction();

    if (error) {
      // RPC 에러를 Supabase Database 에러로 처리
      const errorCode = mapRawErrorToCode(error, "db");

      // 에러에 컨텍스트 정보 추가
      const enhancedError = {
        ...error,
        businessCode: errorCode,
      };

      throw enhancedError;
    }

    return data;
  } catch (error: any) {
    // 이미 처리된 에러는 그대로 던지기
    if (error.businessCode) {
      throw error;
    }

    // 예상치 못한 에러 처리
    const errorCode = mapRawErrorToCode(error, "db");
    const enhancedError = {
      ...error,
      businessCode: errorCode,
    };

    throw enhancedError;
  }
}

export async function POST(request: NextRequest) {
  let user = null;
  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const supabase = await createClient();

    const body = await request.json();
    const { type = "system_logs" } = body; // "system_logs" 또는 "all"

    let result;

    if (type === "all") {
      // 방문자 데이터 정리 - RPC 에러 처리 개선
      let visitorData;
      try {
        visitorData = await executeRPC(async () =>
          supabase.rpc("auto_cleanup_expired_visitor_entries")
        );
      } catch (error: any) {
        throwBusinessError(
          "GENERAL_CLEANUP_FAILED",
          {
            resourceType: "visitor",
          },
          error
        );
      }

      // 시스템 로그 정리 - RPC 에러 처리 개선
      let logData;
      try {
        logData = await executeRPC(async () =>
          supabase.rpc("auto_cleanup_expired_system_logs")
        );
      } catch (error: any) {
        throwBusinessError(
          "GENERAL_CLEANUP_FAILED",
          {
            resourceType: "systemLogs",
          },
          error
        );
      }

      // 결과 통합
      result = [
        ...(Array.isArray(visitorData) ? visitorData : [visitorData]),
        ...(Array.isArray(logData) ? logData : [logData]),
      ];
    } else {
      // 시스템 로그만 정리 - RPC 에러 처리 개선
      try {
        result = await executeRPC(async () =>
          supabase.rpc("auto_cleanup_expired_system_logs")
        );
      } catch (error: any) {
        // RPC 에러를 비즈니스 에러로 throw
        throwBusinessError(
          "GENERAL_CLEANUP_FAILED",
          {
            resourceType: "systemLogs",
          },
          error
        );
      }
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
        totalDeleted = (result as any).deleted_count || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalDeleted}개의 데이터가 정리되었습니다.`,
      results: result,
    });
  } catch (error) {
    // 시스템 에러 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "LOG_CLEANUP_FAILED",
      LOG_MESSAGES.LOG_CLEANUP_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "logs_cleanup",
      {
        action_type: "admin_event",
        event: "logs_cleanup_failed",
        error_message: errorMessage,
      },
      request
    );

    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error, {
      operation: "data_cleanup",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

export async function GET(request: NextRequest) {
  let user = null;
  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

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

    // 만료된 로그 개수 조회 - Prisma 에러 처리 개선
    let expiredLogsCount;
    try {
      expiredLogsCount = await prisma.system_logs.count({
        where: {
          created_at: {
            lt: logCutoffDate,
          },
        },
      });
    } catch (error: any) {
      // Prisma 에러를 비즈니스 에러로 throw
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "expiredData",
        },
        error
      );
    }

    // 만료된 방문자 데이터 개수 조회 - Prisma 에러 처리 개선
    let expiredVisitorsCount;
    try {
      expiredVisitorsCount = await prisma.visitor_entries.count({
        where: {
          visit_datetime: {
            lt: visitorCutoffDate,
          },
        },
      });
    } catch (error: any) {
      // Prisma 에러를 비즈니스 에러로 throw
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "expiredData",
        },
        error
      );
    }

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
    // 시스템 에러 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "EXPIRED_COUNT_QUERY_FAILED",
      LOG_MESSAGES.EXPIRED_COUNT_QUERY_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "logs_cleanup",
      {
        action_type: "admin_event",
        event: "expired_count_query_failed",
        error_message: errorMessage,
      },
      request
    );

    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error);

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
