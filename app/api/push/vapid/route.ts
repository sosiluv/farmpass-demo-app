import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// VAPID 키 생성
export async function POST(request: NextRequest) {
  let user = null;

  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    // VAPID 키 생성
    const vapidKeys = webpush.generateVAPIDKeys();

    // 시스템 로그 기록 (성공)
    await createSystemLog(
      "VAPID_KEY_CREATED",
      LOG_MESSAGES.VAPID_KEY_CREATED(user.id),
      "info",
      { id: user.id, email: user.email || "" },
      "system",
      "push_notification",
      {
        action_type: "push_notification_event",
        event: "vapid_key_created",
        user_id: user.id,
        user_email: user.email,
      },
      request
    );

    return NextResponse.json(
      {
        message: "VAPID 키가 성공적으로 생성되었습니다.",
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
        warning:
          "비공개 키는 안전한 곳에 보관하세요. 이 키는 다시 표시되지 않습니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    // VAPID 키 생성 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "VAPID_KEY_CREATE_FAILED",
      LOG_MESSAGES.VAPID_KEY_CREATE_FAILED(),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "push_notification",
      {
        action_type: "push_notification_event",
        event: "vapid_key_create_failed",
        error_message: errorMessage,
        user_id: user?.id,
        user_email: user?.email,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "generate_vapid_keys",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}

// VAPID 키 조회
export async function GET(request: NextRequest) {
  try {
    // 1. 환경변수에서 VAPID 키 조회 (우선)
    let publicKey = process.env.VAPID_PUBLIC_KEY || null;

    // 2. 환경변수에 없으면 시스템 설정에서 조회
    if (!publicKey) {
      const settings = await getSystemSettings();
      if (settings?.vapidPublicKey) {
        try {
          publicKey = settings.vapidPublicKey;
        } catch (e) {
          devLog.warn("VAPID 키 파싱 실패:", e);
        }
      }
    }

    // 3. 둘 다 없으면 비즈니스 에러 반환
    if (!publicKey) {
      // VAPID 키 미설정 비즈니스 에러 로그
      await createSystemLog(
        "VAPID_KEY_NOT_CONFIGURED",
        LOG_MESSAGES.VAPID_KEY_NOT_CONFIGURED(),
        "warn",
        undefined,
        "system",
        "push_notification",
        {
          action_type: "push_notification_event",
          event: "vapid_key_not_configured",
        },
        request
      );

      throwBusinessError("VAPID_KEY_NOT_CONFIGURED", {
        operation: "get_vapid_public_key",
      });
    }

    // 시스템 로그 기록 (조회 성공)
    await createSystemLog(
      "VAPID_KEY_CONFIGURED",
      LOG_MESSAGES.VAPID_KEY_CONFIGURED(),
      "info",
      undefined,
      "system",
      "push_notification",
      {
        action_type: "push_notification_event",
        event: "vapid_key_configured",
      },
      request
    );

    return NextResponse.json({
      publicKey: publicKey,
    });
  } catch (error) {
    // VAPID 키 조회 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "VAPID_KEY_FETCH_FAILED",
      LOG_MESSAGES.VAPID_KEY_FETCH_FAILED(errorMessage),
      "error",
      undefined,
      "system",
      "push_notification",
      {
        action_type: "push_notification_event",
        event: "vapid_key_fetch_failed",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_vapid_public_key",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
