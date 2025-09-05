import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function POST(request: NextRequest) {
  let user = null;
  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const {
      title,
      message,
      url = "/admin/dashboard",
      requireInteraction = false,
      notificationType = "system",
    } = body;

    // 입력 검증 - 비즈니스 에러 throw
    const missingFields: string[] = [];
    if (!title) missingFields.push("title");
    if (!message) missingFields.push("message");
    if (!notificationType) missingFields.push("notificationType");

    if (missingFields.length > 0) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields,
      });
    }

    // 알림 유형 검증 - 비즈니스 에러 throw
    const validTypes = ["visitor", "system"];
    if (!validTypes.includes(notificationType)) {
      throwBusinessError("BROADCAST_INVALID_TYPE", {
        validTypes,
        providedType: notificationType,
      });
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
      // 푸시 알림 실패 시 비즈니스 에러 throw
      throwBusinessError(
        "BROADCAST_PUSH_FAILED",
        {
          sentCount: result.sentCount || 0,
          failureCount: result.failureCount || 0,
        },
        result.error
      );
    }

    // 성공 로그 - 템플릿 활용
    await createSystemLog(
      "BROADCAST_NOTIFICATION_SENT",
      LOG_MESSAGES.BROADCAST_NOTIFICATION_SENT(
        user.email || "",
        result.sentCount
      ),
      "info",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "broadcast_notification",
      {
        action_type: "admin_event",
        event: "broadcast_notification_sent",
        title,
        url,
        require_interaction: requireInteraction,
        notification_type: notificationType,
      },
      request
    );

    return NextResponse.json(result);
  } catch (error: any) {
    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error, {
      operation: "broadcast_notification",
    });

    // 시스템 로그 - 템플릿 활용
    await createSystemLog(
      "BROADCAST_NOTIFICATION_FAILED",
      LOG_MESSAGES.BROADCAST_NOTIFICATION_FAILED(result.detail),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "broadcast_notification",
      {
        action_type: "admin_event",
        event: "broadcast_notification_failed",
        error_code: result.code,
        error_message: result.detail,
      },
      request
    );

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
