import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  logApiError,
  logVisitorDataAccess,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

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
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
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
      { error: "Failed to count today's visitors" },
      { status: 500 }
    );
  }
}
