import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  try {
    const farmId = params.farmId;

    // 오늘 자정 시간 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 내일 자정 시간 계산
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 농장 정보와 방문자 수를 함께 가져오기
    let farm, count;
    try {
      [farm, count] = await Promise.all([
        prisma.farms.findUnique({
          where: { id: farmId },
          select: { farm_name: true },
        }),
        prisma.visitor_entries.count({
          where: {
            farm_id: farmId,
            visit_datetime: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
      ]);
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "visitor",
        },
        queryError
      );
    }

    if (!farm) {
      throwBusinessError("FARM_NOT_FOUND", {
        operation: "get_visitor_count",
        farmId: farmId,
      });
    }

    // 시스템 설정 조회
    const settings = await getSystemSettings();

    // 일일 방문자 수 제한 확인
    if (count >= settings.maxVisitorsPerDay) {
      // 일일 한도 초과 경고 로그
      await createSystemLog(
        "VISITOR_DAILY_LIMIT_WARNING",
        LOG_MESSAGES.VISITOR_DAILY_LIMIT_WARNING(
          count,
          settings.maxVisitorsPerDay,
          farm.farm_name
        ),
        "warn",
        undefined,
        "visitor",
        farmId,
        {
          action_type: "visitor_event",
          event: "visitor_daily_limit_warning",
          farm_id: farmId,
          farm_name: farm.farm_name,
          today_count: count,
          max_visitors_per_day: settings.maxVisitorsPerDay,
        },
        request
      );
    }

    return NextResponse.json({ count, farm_name: farm.farm_name });
  } catch (error) {
    // 방문자 수 조회 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "VISITOR_COUNT_QUERY_FAILED",
      LOG_MESSAGES.VISITOR_COUNT_QUERY_FAILED(errorMessage),
      "error",
      undefined,
      "visitor",
      params.farmId,
      {
        action_type: "visitor_event",
        event: "visitor_count_query_failed",
        error_message: errorMessage,
        farm_id: params.farmId,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_visitor_count_today",
      farmId: params.farmId,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
