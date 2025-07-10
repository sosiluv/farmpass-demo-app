import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "1095");

    if (isNaN(days) || days <= 0) {
      // 유효하지 않은 파라미터 실패 로그
      await createSystemLog(
        "EXPIRED_COUNT_INVALID_PARAMS",
        `만료된 방문자 데이터 개수 조회 실패: 유효하지 않은 보존 기간 (${days})`,
        "error",
        undefined,
        "visitor",
        undefined,
        {
          requested_days: days,
          action_type: "data_retention_check",
          status: "failed",
        },
        undefined,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        { error: "유효하지 않은 보존 기간입니다." },
        { status: 400 }
      );
    }

    // 현재 날짜에서 보존 기간을 뺀 날짜 계산
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 만료된 방문자 데이터 개수 조회
    const expiredCount = await prisma.visitor_entries.count({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      count: expiredCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: days,
    });
  } catch (error) {
    devLog.error("만료된 방문자 데이터 개수 확인 오류:", error);

    // 실패 로그 기록 (error 레벨)
    try {
      await createSystemLog(
        "EXPIRED_COUNT_QUERY_FAILED",
        `만료된 방문자 데이터 개수 조회 실패: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        undefined,
        "visitor",
        undefined,
        {
          error_details: error instanceof Error ? error.stack : undefined,
          action_type: "data_retention_check",
          status: "failed",
        },
        undefined,
        clientIP,
        userAgent
      );
    } catch (logError) {
      devLog.error("Failed to log expired count error:", logError);
    }

    return NextResponse.json(
      { error: "만료된 방문자 데이터 개수 확인에 실패했습니다." },
      { status: 500 }
    );
  }
}
