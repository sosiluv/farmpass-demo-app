import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "1095");

    if (isNaN(days) || days <= 0) {
      // 유효하지 않은 파라미터 실패 로그
      await createSystemLog(
        "EXPIRED_COUNT_INVALID_PARAMS",
        LOG_MESSAGES.EXPIRED_COUNT_INVALID_PARAMS(days),
        "error",
        undefined,
        "visitor",
        "expired_count",
        {
          action_type: "visitor_event",
          event: "expired_count_invalid_params",
          requested_days: days,
        },
        request
      );

      throwBusinessError("INVALID_RETENTION_PERIOD", {
        requestedDays: days,
      });
    }

    // 현재 날짜에서 보존 기간을 뺀 날짜 계산
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 만료된 방문자 데이터 개수 조회
    let expiredCount;
    try {
      expiredCount = await prisma.visitor_entries.count({
        where: {
          created_at: {
            lt: cutoffDate,
          },
        },
      });
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "expiredData",
        },
        error
      );
    }

    return NextResponse.json({
      count: expiredCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: days,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // 실패 로그 기록 (error 레벨)
    await createSystemLog(
      "EXPIRED_COUNT_QUERY_FAILED",
      LOG_MESSAGES.EXPIRED_COUNT_QUERY_FAILED(errorMessage),
      "error",
      undefined,
      "visitor",
      "expired_count",
      {
        action_type: "visitor_event",
        event: "expired_count_query_failed",
        error_message: errorMessage,
      },
      request
    );

    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error, {
      operation: "expired_count_query",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
