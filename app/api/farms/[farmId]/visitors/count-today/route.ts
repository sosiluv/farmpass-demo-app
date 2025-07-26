import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError, createSystemLog } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const farmId = params.farmId;

    // 오늘 자정 시간 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 내일 자정 시간 계산
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 농장 정보와 방문자 수를 함께 가져오기
    const [farm, count] = await Promise.all([
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

    if (!farm) {
      // API 에러 로그 기록 (농장 없음)
      await logApiError(
        "/api/farms/[farmId]/visitors/count-today",
        "GET",
        "Farm not found",
        undefined,
        {
          ip: clientIP,
          userAgent,
        }
      );
      return NextResponse.json(
        {
          success: false,
          error: "FARM_NOT_FOUND",
          message: "농장을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 시스템 설정 조회
    const settings = await getSystemSettings();

    // 일일 방문자 수 제한 확인
    if (count >= settings.maxVisitorsPerDay) {
      // 일일 한도 초과 경고 로그
      await createSystemLog(
        "VISITOR_DAILY_LIMIT_WARNING",
        `일일 방문자 수 한도에 도달했습니다: ${count}/${settings.maxVisitorsPerDay}명 (농장: ${farm.farm_name})`,
        "warn",
        undefined,
        "visitor",
        undefined,
        {
          farm_id: farmId,
          farm_name: farm.farm_name,
          today_count: count,
          max_visitors_per_day: settings.maxVisitorsPerDay,
          action_type: "daily_limit_check",
        },
        undefined,
        clientIP,
        userAgent
      );
    }

    return NextResponse.json({ count, farm_name: farm.farm_name });
  } catch (error) {
    devLog.error("Error counting today's visitors:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/farms/[farmId]/visitors/count-today",
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
        error: "VISITOR_COUNT_ERROR",
        message: "오늘의 방문자 수를 확인할 수 없습니다.",
      },
      { status: 500 }
    );
  }
}
