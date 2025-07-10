import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const farmId = params.farmId;
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("visitor_session")?.value;

    // 세션이 없으면 첫 방문으로 간주
    if (!sessionToken) {
      // 세션 없음 로그 기록 (정상적인 첫 방문)
      await createSystemLog(
        "VISITOR_SESSION_NOT_FOUND",
        `방문자 세션 없음 - 첫 방문 (농장 ID: ${farmId})`,
        "info",
        undefined,
        "visitor",
        undefined,
        {
          farm_id: farmId,
          session_token: "none",
          visit_type: "first_visit",
          status: "normal",
        },
        undefined,
        clientIP,
        userAgent
      );
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
      // 세션은 있으나 방문 기록 없음 로그 (정상적인 상황)
      await createSystemLog(
        "VISITOR_RECORD_NOT_FOUND",
        `방문자 기록 없음 - 새 방문자 (농장 ID: ${farmId})`,
        "info",
        undefined,
        "visitor",
        undefined,
        {
          farm_id: farmId,
          session_token: sessionToken,
          visit_type: "new_visitor",
          status: "normal",
        },
        undefined,
        clientIP,
        userAgent
      );
      return NextResponse.json({ isFirstVisit: true });
    }

    // 마지막 방문 시간과 현재 시간의 차이 계산 (시간 단위)
    const hoursSinceLastVisit =
      (Date.now() - new Date(lastVisit.visit_datetime).getTime()) /
      (1000 * 60 * 60);

    // 세션 만료 여부 확인
    const isExpired = hoursSinceLastVisit >= settings.reVisitAllowInterval;

    if (isExpired) {
      // 세션 만료 로그 기록 (정상적인 만료)
      await createSystemLog(
        "VISITOR_SESSION_EXPIRED",
        `방문자 세션 만료 - ${Math.round(
          hoursSinceLastVisit
        )}시간 경과 (농장 ID: ${farmId})`,
        "info",
        undefined,
        "visitor",
        undefined,
        {
          farm_id: farmId,
          session_token: sessionToken,
          hours_since_last_visit: Math.round(hoursSinceLastVisit),
          visit_allow_interval: settings.reVisitAllowInterval,
          visit_type: "expired_session",
          status: "normal",
        },
        undefined,
        clientIP,
        userAgent
      );

      // 세션이 만료되었으면 쿠키 삭제
      cookies().delete("visitor_session");
      return NextResponse.json({ isFirstVisit: true });
    }

    // 유효한 세션 로그 기록 (재방문)
    await createSystemLog(
      "VISITOR_SESSION_VALID",
      `방문자 세션 유효 - 재방문 (${Math.round(
        settings.reVisitAllowInterval - hoursSinceLastVisit
      )}시간 남음, 농장 ID: ${farmId})`,
      "info",
      undefined,
      "visitor",
      undefined,
      {
        farm_id: farmId,
        session_token: sessionToken,
        hours_since_last_visit: Math.round(hoursSinceLastVisit),
        remaining_hours: Math.round(
          settings.reVisitAllowInterval - hoursSinceLastVisit
        ),
        visit_type: "return_visit",
        status: "normal",
      },
      undefined,
      clientIP,
      userAgent
    );

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

    // API 에러 로그 기록
    await createSystemLog(
      "VISITOR_SESSION_CHECK_ERROR",
      `방문자 세션 체크 오류: ${
        error instanceof Error ? error.message : String(error)
      } (농장 ID: ${params.farmId})`,
      "error",
      undefined,
      "visitor",
      undefined,
      {
        endpoint: "/api/farms/[farmId]/visitors/check-session",
        method: "GET",
        error: error instanceof Error ? error.message : String(error),
        farm_id: params.farmId,
        status: "failed",
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { error: "Failed to check session" },
      { status: 500 }
    );
  }
}
