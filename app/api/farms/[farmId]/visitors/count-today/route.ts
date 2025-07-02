import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";

export async function GET(
  request: Request,
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
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    return NextResponse.json({ count, farm_name: farm.farm_name });
  } catch (error) {
    devLog.error("Error counting today's visitors:", error);
    return NextResponse.json(
      { error: "Failed to count today's visitors" },
      { status: 500 }
    );
  }
}
