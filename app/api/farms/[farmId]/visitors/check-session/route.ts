import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { createSystemLog } from "@/lib/utils/logging/system-log";
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
  const farmId = params.farmId;

  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("visitor_session")?.value;

    // 1. 세션 쿠키가 없으면 첫 방문 처리
    if (!sessionToken) {
      await createSystemLog(
        "VISITOR_SESSION_NOT_FOUND",
        LOG_MESSAGES.VISITOR_SESSION_NOT_FOUND(farmId),
        "info",
        undefined,
        "visitor",
        undefined,
        {
          action_type: "visitor_event",
          event: "visitor_session_not_found",
          farm_id: farmId,
          session_token: "none",
        },
        request
      );
      return NextResponse.json({ isFirstVisit: true });
    }

    // 2. 시스템 설정 및 방문 기록 조회
    const settings = await getSystemSettings();
    let lastVisit;
    try {
      lastVisit = await prisma.visitor_entries.findFirst({
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
    } catch (visitorError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "visitor",
        },
        visitorError
      );
    }

    // 3. 방문 기록이 없으면 첫 방문 처리
    if (!lastVisit) {
      await createSystemLog(
        "VISITOR_RECORD_NOT_FOUND",
        LOG_MESSAGES.VISITOR_RECORD_NOT_FOUND(farmId),
        "info",
        undefined,
        "visitor",
        undefined,
        {
          action_type: "visitor_event",
          event: "visitor_record_not_found",
          farm_id: farmId,
          session_token: sessionToken,
        },
        request
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
        LOG_MESSAGES.VISITOR_SESSION_EXPIRED(
          Math.round(hoursSinceLastVisit),
          farmId
        ),
        "info",
        undefined,
        "visitor",
        undefined,
        {
          action_type: "visitor_event",
          event: "visitor_session_expired",
          farm_id: farmId,
          session_token: sessionToken,
          hours_since_last_visit: Math.round(hoursSinceLastVisit),
          visit_allow_interval: reVisitAllowInterval,
        },
        request
      );
      // 만료: 쿠키가 있으면 자동완성 제공, 없으면 첫 방문 처리
      if (sessionToken && lastVisit) {
        return NextResponse.json({
          isFirstVisit: false,
          lastVisit: {
            visit_datetime: lastVisit.visit_datetime,
            visitor_name: lastVisit.visitor_name,
            visitor_phone: lastVisit.visitor_phone,
            visitor_address: lastVisit.visitor_address,
            vehicle_number: lastVisit.vehicle_number,
            visitor_purpose: lastVisit.visitor_purpose,
            profile_photo_url: lastVisit.profile_photo_url,
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
      LOG_MESSAGES.VISITOR_SESSION_VALID(Math.round(remainingHours), farmId),
      "info",
      undefined,
      "visitor",
      undefined,
      {
        action_type: "visitor_event",
        event: "visitor_session_valid",
        farm_id: farmId,
        session_token: sessionToken,
        hours_since_last_visit: Math.round(hoursSinceLastVisit),
        remaining_hours: Math.round(remainingHours),
      },
      request
    );
    return NextResponse.json({
      isFirstVisit: false,
      lastVisit: {
        visit_datetime: lastVisit.visit_datetime,
        visitor_name: lastVisit.visitor_name,
        visitor_phone: lastVisit.visitor_phone,
        visitor_address: lastVisit.visitor_address,
        vehicle_number: lastVisit.vehicle_number,
        visitor_purpose: lastVisit.visitor_purpose,
        profile_photo_url: lastVisit.profile_photo_url,
      },
      sessionInfo: {
        remainingHours,
        reVisitAllowInterval,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "VISITOR_SESSION_CHECK_ERROR",
      LOG_MESSAGES.VISITOR_SESSION_CHECK_ERROR(params.farmId, errorMessage),
      "error",
      undefined,
      "visitor",
      undefined,
      {
        action_type: "visitor_event",
        event: "visitor_session_check_error",
        error_message: errorMessage,
        endpoint: "/api/farms/[farmId]/visitors/check-session",
        method: "GET",
        farm_id: params.farmId,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "check_visitor_session",
      farmId: params.farmId,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
