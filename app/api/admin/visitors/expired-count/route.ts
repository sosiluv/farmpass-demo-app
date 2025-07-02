import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "1095");

    if (isNaN(days) || days <= 0) {
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
    return NextResponse.json(
      { error: "만료된 방문자 데이터 개수 확인에 실패했습니다." },
      { status: 500 }
    );
  }
}
