import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";

export async function GET(
  request: Request,
  { params }: { params: { farmId: string } }
) {
  try {
    const farmId = params.farmId;
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("visitor_session")?.value;

    // 세션이 없으면 첫 방문으로 간주
    if (!sessionToken) {
      return NextResponse.json({ isFirstVisit: true });
    }

    // 시스템 설정 조회 (캐시 사용)
    const settings = await getSystemSettings();

    // 세션으로 최근 방문 기록 조회
    const lastVisit = await prisma.visitor_entries.findFirst({
      where: {
        farm_id: farmId,
        session_token: sessionToken,
      },
      orderBy: {
        visit_datetime: "desc",
      },
      select: {
        visit_datetime: true,
        visitor_name: true,
        visitor_phone: true,
        visitor_address: true,
        vehicle_number: true,
        visitor_purpose: true,
      },
    });

    // 방문 기록이 없으면 첫 방문으로 간주
    if (!lastVisit) {
      return NextResponse.json({ isFirstVisit: true });
    }

    // 마지막 방문 시간과 현재 시간의 차이 계산 (시간 단위)
    const hoursSinceLastVisit =
      (Date.now() - new Date(lastVisit.visit_datetime).getTime()) /
      (1000 * 60 * 60);

    // 세션 만료 여부 확인
    const isExpired = hoursSinceLastVisit >= settings.reVisitAllowInterval;

    if (isExpired) {
      // 세션이 만료되었으면 쿠키 삭제
      cookies().delete("visitor_session");
      return NextResponse.json({ isFirstVisit: true });
    }

    // 유효한 세션인 경우 마지막 방문 정보 반환
    return NextResponse.json({
      isFirstVisit: false,
      lastVisit: {
        visitDateTime: lastVisit.visit_datetime,
        visitorName: lastVisit.visitor_name,
        visitorPhone: lastVisit.visitor_phone,
        visitorAddress: lastVisit.visitor_address,
        vehicleNumber: lastVisit.vehicle_number,
        visitPurpose: lastVisit.visitor_purpose,
      },
      sessionInfo: {
        remainingHours: settings.reVisitAllowInterval - hoursSinceLastVisit,
        reVisitAllowInterval: settings.reVisitAllowInterval,
      },
    });
  } catch (error) {
    devLog.error("Error checking session:", error);
    return NextResponse.json(
      { error: "Failed to check session" },
      { status: 500 }
    );
  }
}
