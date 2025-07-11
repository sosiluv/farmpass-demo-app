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
  const farmId = params.farmId;

  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("visitor_session")?.value;

    // 1. 세션 쿠키가 없으면 첫 방문 처리
    if (!sessionToken) {
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

    // 2. 시스템 설정 및 방문 기록 조회
    const settings = await getSystemSettings();
    const lastVisit = await prisma.visitor_entries.findFirst({
      where: { farm_id: farmId, session_token: sessionToken },
      orderBy: { visit_datetime: "desc" },
      select: {
        visit_datetime: true,
        visitor_name: true,
        visitor_phone: true,
        visitor_address: true,
        vehicle_number: true,
        visitor_purpose: true,
        profile_photo_url: true, // 프로필 사진 URL 추가
      },
    });

    // 3. 방문 기록이 없으면 첫 방문 처리
    if (!lastVisit) {
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

    // 4. 방문 시간 차이 계산 및 만료 여부 판단
    const hoursSinceLastVisit =
      (Date.now() - new Date(lastVisit.visit_datetime).getTime()) /
      (1000 * 60 * 60);
    const reVisitAllowInterval = settings.reVisitAllowInterval;
    const isExpired =
      reVisitAllowInterval > 0 && hoursSinceLastVisit >= reVisitAllowInterval;

    if (isExpired) {
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
          visit_allow_interval: reVisitAllowInterval,
          visit_type: "expired_session",
          status: "normal",
        },
        undefined,
        clientIP,
        userAgent
      );
      // 만료: 쿠키가 있으면 자동완성 제공, 없으면 첫 방문 처리
      if (sessionToken && lastVisit) {
        return NextResponse.json({
          isFirstVisit: false,
          lastVisit: {
            visitDateTime: lastVisit.visit_datetime,
            visitorName: lastVisit.visitor_name,
            visitorPhone: lastVisit.visitor_phone,
            visitorAddress: lastVisit.visitor_address,
            vehicleNumber: lastVisit.vehicle_number,
            visitPurpose: lastVisit.visitor_purpose,
            profilePhotoUrl: lastVisit.profile_photo_url,
          },
          sessionInfo: {
            remainingHours: 0,
            reVisitAllowInterval,
          },
        });
      }
      return NextResponse.json({ isFirstVisit: true });
    }

    // 5. 유효한 세션(재방문 제한 중)
    const remainingHours = reVisitAllowInterval - hoursSinceLastVisit;
    await createSystemLog(
      "VISITOR_SESSION_VALID",
      `방문자 세션 유효 - 재방문 (${Math.round(
        remainingHours
      )}시간 남음, 농장 ID: ${farmId})`,
      "info",
      undefined,
      "visitor",
      undefined,
      {
        farm_id: farmId,
        session_token: sessionToken,
        hours_since_last_visit: Math.round(hoursSinceLastVisit),
        remaining_hours: Math.round(remainingHours),
        visit_type: "return_visit",
        status: "normal",
      },
      undefined,
      clientIP,
      userAgent
    );
    return NextResponse.json({
      isFirstVisit: false,
      lastVisit: {
        visitDateTime: lastVisit.visit_datetime,
        visitorName: lastVisit.visitor_name,
        visitorPhone: lastVisit.visitor_phone,
        visitorAddress: lastVisit.visitor_address,
        vehicleNumber: lastVisit.vehicle_number,
        visitPurpose: lastVisit.visitor_purpose,
        profilePhotoUrl: lastVisit.profile_photo_url,
      },
      sessionInfo: {
        remainingHours,
        reVisitAllowInterval,
      },
    });
  } catch (error) {
    devLog.error("Error checking session:", error);
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
