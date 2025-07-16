import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import {
  getSystemSettings,
  invalidateSystemSettingsCache,
} from "@/lib/cache/system-settings-cache";
import {
  processVisitTemplate,
  createVisitTemplateData,
} from "@/lib/utils/notification/notification-template";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { sendSupabaseBroadcast } from "@/lib/supabase/broadcast";

interface VisitorData {
  fullName: string;
  phoneNumber: string;
  address: string;
  detailedAddress: string;
  carPlateNumber: string;
  visitPurpose: string;
  disinfectionCheck: boolean;
  notes: string;
  consentGiven: boolean;
  profile_photo_url?: string | null;
  dataRetentionDays?: number;
}

// 농장 멤버들에게 푸시 알림 발송 함수
async function sendVisitorNotificationToFarmMembers(
  farmId: string,
  visitorData: {
    visitor_name: string;
    visitor_phone?: string;
    visitor_purpose?: string;
    vehicle_number?: string;
    disinfection_check?: boolean;
  },
  farmName: string,
  visitDateTime: Date = new Date()
) {
  try {
    // 시스템 설정에서 방문 알림 템플릿 가져오기 (캐시 무효화 후 조회)
    invalidateSystemSettingsCache();
    const settings = await getSystemSettings();

    // 템플릿 데이터 생성
    const templateData = createVisitTemplateData(
      visitorData,
      farmName,
      visitDateTime
    );

    // 템플릿을 사용하여 메시지 생성
    const notificationMessage = processVisitTemplate(
      settings.visitTemplate,
      templateData
    );

    // 농장 소유자와 멤버들의 알림 설정 조회
    const farmMembersWithNotifications = (await prisma.$queryRaw`
      SELECT DISTINCT u.id, u.email, uns.notification_method, uns.visitor_alerts
      FROM auth.users u
      LEFT JOIN public.user_notification_settings uns ON u.id = uns.user_id
      WHERE (
        u.id IN (
          SELECT owner_id FROM public.farms WHERE id = ${farmId}::uuid
          UNION
          SELECT user_id FROM public.farm_members WHERE farm_id = ${farmId}::uuid
        )
      )
      AND uns.notification_method = 'push'
      AND uns.visitor_alerts = true
    `) as Array<{
      id: string;
      email: string;
      notification_method: string | null;
      visitor_alerts: boolean | null;
    }>;

    if (!farmMembersWithNotifications?.length) {
      devLog.log("푸시 알림을 받을 농장 멤버가 없습니다.");
      return;
    }

    // 각 멤버에게 개별적으로 알림 발송
    for (const member of farmMembersWithNotifications) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/push/send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "node-fetch/3.0.0",
            },
            body: JSON.stringify({
              targetUserIds: [member.id],
              farmId,
              title: "새로운 방문자 등록",
              message: notificationMessage,
              url: `/admin/farms/${farmId}/visitors`,
              notificationType: "visitor",
            }),
          }
        );

        if (!response.ok) {
          devLog.error(
            `멤버 ${member.email}에게 푸시 알림 발송 실패:`,
            await response.text()
          );
        } else {
          devLog.log(`멤버 ${member.email}에게 푸시 알림 발송 성공`);
        }
      } catch (error) {
        devLog.error(`멤버 ${member.email}에게 푸시 알림 발송 중 오류:`, error);
      }
    }
  } catch (error) {
    devLog.error("농장 멤버 푸시 알림 발송 중 오류:", error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  const farmId = params.farmId;
  let visitorData: VisitorData | undefined;
  let farm: { id: string; farm_name: string } | null = null;

  try {
    const requestData = await request.json();
    if (!requestData || typeof requestData !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST_DATA",
          message: "방문자 정보가 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }
    visitorData = requestData as VisitorData;
    const cookieStore = cookies();

    // 시스템 설정 조회 (캐시 무효화 후 조회)
    invalidateSystemSettingsCache();
    const settings = await getSystemSettings();

    // 기존 세션 토큰 확인
    const sessionToken = cookieStore.get("visitor_session")?.value;
    if (sessionToken) {
      // 세션으로 최근 방문 기록 조회
      const lastVisit = await prisma.visitor_entries.findFirst({
        where: {
          farm_id: farmId,
          session_token: sessionToken,
        },
        orderBy: {
          visit_datetime: "desc",
        },
      });

      if (lastVisit) {
        // 마지막 방문 시간과 현재 시간의 차이 계산 (시간 단위)
        const hoursSinceLastVisit =
          (Date.now() - new Date(lastVisit.visit_datetime).getTime()) /
          (1000 * 60 * 60);

        // 재방문 제한 기간 체크
        if (hoursSinceLastVisit < settings.reVisitAllowInterval) {
          const remainingHours = Math.ceil(
            settings.reVisitAllowInterval - hoursSinceLastVisit
          );
          return NextResponse.json(
            {
              message: `재방문은 ${settings.reVisitAllowInterval}시간 후에 가능합니다. (남은 시간: ${remainingHours}시간)`,
            },
            { status: 400 }
          );
        } else {
          // 재방문 제한 기간이 지났으면 기존 세션 삭제
          cookies().delete("visitor_session");
        }
      }
    }

    // 재방문 허용 간격(시간)을 밀리초로 변환
    // const sessionDuration = settings.reVisitAllowInterval * 60 * 60 * 1000;

    // 새로운 세션 토큰 생성
    const newSessionToken = uuidv4();

    // 세션 토큰을 쿠키에 저장
    // 폼 자동완성을 위해 30일 고정으로 설정
    const cookieExpiresMs = 30 * 24 * 60 * 60 * 1000; // 30일

    cookieStore.set("visitor_session", newSessionToken, {
      expires: new Date(Date.now() + cookieExpiresMs),
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
    });

    // 농장 정보 조회
    farm = await prisma.farms.findUnique({
      where: { id: farmId },
      select: { id: true, farm_name: true },
    });

    if (!farm) {
      return NextResponse.json(
        { message: "존재하지 않는 농장입니다." },
        { status: 404 }
      );
    }

    // 필수 필드 검증
    if (!visitorData.fullName?.trim()) {
      return NextResponse.json(
        { message: "성명은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    if (!visitorData.consentGiven) {
      return NextResponse.json(
        { message: "개인정보 수집에 동의해주세요." },
        { status: 400 }
      );
    }

    // 오늘 방문자 수 체크 (일일 제한)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayCount = await prisma.visitor_entries.count({
      where: {
        farm_id: farmId,
        visit_datetime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    if (todayCount >= settings.maxVisitorsPerDay) {
      // 일일 방문자 수 초과 로그
      await createSystemLog(
        "VISITOR_DAILY_LIMIT_EXCEEDED",
        `일일 방문자 수 초과: ${todayCount}/${settings.maxVisitorsPerDay}명 (농장: ${farm.farm_name}, 방문자: ${visitorData.fullName})`,
        "warn",
        undefined,
        "visitor",
        undefined,
        {
          farm_id: farmId,
          farm_name: farm.farm_name,
          count: todayCount,
          maxVisitorsPerDay: settings.maxVisitorsPerDay,
          visitor_name: visitorData.fullName,
          access_scope: "single_farm",
          status: "failed",
        },
        undefined,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        {
          message: `오늘 방문자 등록 한도(${settings.maxVisitorsPerDay}명)를 초과했습니다.`,
          error: "DAILY_LIMIT_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // 방문자 데이터 저장 (Prisma 사용하되 실시간 위해 BroadcastChannel 활용)
    const visitor = await prisma.visitor_entries.create({
      data: {
        farm_id: farmId,
        visit_datetime: new Date(),
        visitor_name: visitorData.fullName.trim(),
        visitor_phone: visitorData.phoneNumber?.trim() || "",
        visitor_address: `${visitorData.address?.trim() || ""}${
          visitorData.detailedAddress?.trim()
            ? " " + visitorData.detailedAddress.trim()
            : ""
        }`,
        vehicle_number: visitorData.carPlateNumber?.trim() || null,
        visitor_purpose: visitorData.visitPurpose?.trim() || null,
        disinfection_check: visitorData.disinfectionCheck || false,
        notes: visitorData.notes?.trim() || null,
        consent_given: visitorData.consentGiven,
        profile_photo_url: visitorData.profile_photo_url || null,
        session_token: newSessionToken,
      },
    });

    console.log("🎉 [VISITOR-API] 방문자 등록 완료:", visitor);
    devLog.log("🎉 [VISITOR-API] 방문자 등록 완료:", visitor);

    // 🔥 실시간 업데이트를 위한 Supabase Broadcast 강제 발송
    await sendSupabaseBroadcast({
      channel: "visitor_updates",
      event: "visitor_inserted",
      payload: {
        eventType: "INSERT",
        new: visitor,
        old: null,
        table: "visitor_entries",
        schema: "public",
      },
    });

    // 방문자 등록 성공 로그 생성
    await createSystemLog(
      "VISITOR_CREATED",
      `방문자 등록: ${String(visitor.visitor_name)} (농장: ${
        farm.farm_name
      }, 방문자 ID: ${String(visitor.id)})`,
      "info",
      undefined,
      "visitor",
      String(visitor.id),
      {
        farm_id: farmId,
        farm_name: farm.farm_name,
        visitor_id: String(visitor.id),
        visitor_name: String(visitor.visitor_name),
        access_scope: "single_farm",
        status: "success",
        metadata: {
          visitor_phone: String(visitor.visitor_phone || ""),
          visit_purpose: String(visitor.visitor_purpose || ""),
          has_photo: !!visitor.profile_photo_url,
          has_vehicle: !!visitor.vehicle_number,
          disinfection_check: Boolean(visitor.disinfection_check) || false,
          consent_given: Boolean(visitor.consent_given) || false,
          is_new_registration: true,
        },
      },
      undefined,
      clientIP,
      userAgent
    );

    // 농장 멤버들에게 푸시 알림 발송 (비동기로 처리하여 응답 속도에 영향 주지 않음)
    sendVisitorNotificationToFarmMembers(
      farmId,
      {
        visitor_name: String(visitor.visitor_name),
        visitor_phone: visitor.visitor_phone
          ? String(visitor.visitor_phone)
          : undefined,
        visitor_purpose: visitor.visitor_purpose
          ? String(visitor.visitor_purpose)
          : undefined,
        vehicle_number: visitor.vehicle_number
          ? String(visitor.vehicle_number)
          : undefined,
        disinfection_check: Boolean(visitor.disinfection_check) || false,
      },
      farm.farm_name,
      new Date(String(visitor.visit_datetime))
    );

    // 응답 생성 및 쿠키 설정
    return NextResponse.json(
      {
        success: true,
        message: "방문자 등록이 완료되었습니다.",
        visitor,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error creating visitor:", error);

    // 방문자 등록 실패 로그 생성
    await createSystemLog(
      "VISITOR_CREATION_FAILED",
      `방문자 등록 실패: ${visitorData?.fullName || "알 수 없음"} - ${
        error instanceof Error ? error.message : String(error)
      } (농장 ID: ${farmId})`,
      "error",
      undefined,
      "visitor",
      undefined,
      {
        farm_id: farmId,
        farm_name: farm?.farm_name,
        visitor_name: visitorData?.fullName || "알 수 없음",
        access_scope: "single_farm",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          is_new_registration: true,
        },
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "VISITOR_CREATE_ERROR",
        message: "방문자 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const farmId = params.farmId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const visitors = await prisma.visitor_entries.findMany({
      where: { farm_id: farmId },
      orderBy: { visit_datetime: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.visitor_entries.count({
      where: { farm_id: farmId },
    });

    return NextResponse.json({
      visitors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    devLog.error("Error fetching visitors:", error);

    // 방문자 조회 실패 로그 기록
    await createSystemLog(
      "VISITOR_FETCH_FAILED",
      `방문자 조회 실패: ${
        error instanceof Error ? error.message : String(error)
      } (농장 ID: ${params.farmId})`,
      "error",
      undefined,
      "visitor",
      undefined,
      {
        farm_id: params.farmId,
        error: error instanceof Error ? error.message : String(error),
        action: "visitor_list_fetch",
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "VISITOR_FETCH_ERROR",
        message: "방문자 정보 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
