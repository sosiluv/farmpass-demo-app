import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import { logApiError } from "@/lib/utils/logging/system-log";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const supabase = await createClient();

    const body = await request.json();
    const {
      title,
      message,
      url = "/admin/dashboard",
      requireInteraction = false,
      notificationType = "notice",
    } = body;

    // 입력 검증
    if (!title || !message || !notificationType) {
      return NextResponse.json(
        {
          error: "MISSING_REQUIRED_FIELDS",
          message: "제목, 메시지, 알림 유형은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 알림 유형 검증
    if (
      !["visitor", "emergency", "maintenance", "notice"].includes(
        notificationType
      )
    ) {
      return NextResponse.json(
        {
          error: "INVALID_NOTIFICATION_TYPE",
          message: "유효하지 않은 알림 유형입니다.",
        },
        { status: 400 }
      );
    }

    // 푸시 알림 발송
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const response = await fetch(`${baseUrl}/api/push/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "node-fetch/3.0.0",
      },
      body: JSON.stringify({
        title,
        message,
        url,
        requireInteraction,
        notificationType,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "PUSH_NOTIFICATION_SENDING_FAILED",
          message: result.error || "푸시 알림 발송에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 성공 로그
    await createSystemLog(
      "BROADCAST_NOTIFICATION_SENT",
      `브로드캐스트 알림 발송 완료: ${result.sentCount}명에게 발송`,
      "info",
      user.id,
      "system",
      "all",
      {
        notification_type: notificationType,
        title,
        message,
        sent_count: result.sentCount,
        failure_count: result.failureCount,
        url,
        require_interaction: requireInteraction,
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(result);
  } catch (error) {
    devLog.error("브로드캐스트 API 오류:", error);

    // API 에러 로깅
    await logApiError(
      "/api/admin/broadcast",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    // 실패 로그
    await createSystemLog(
      "BROADCAST_NOTIFICATION_FAILED",
      `브로드캐스트 알림 발송 실패: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      undefined,
      "system",
      "all",
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "BROADCAST_SENDING_FAILED",
        message: "브로드캐스트 알림 발송에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
