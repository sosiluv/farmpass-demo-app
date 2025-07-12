import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";

// VAPID 키 생성
export async function POST(request: NextRequest) {
  // IP, userAgent 추출
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

    // VAPID 키 생성
    const vapidKeys = webpush.generateVAPIDKeys();

    // 시스템 로그 기록 (성공)
    await createSystemLog(
      "VAPID_KEY_CREATED",
      `VAPID 키가 생성되었습니다. (사용자: ${user.id})`,
      "info",
      user.id,
      "system",
      undefined,
      undefined,
      user.email,
      clientIP,
      userAgent
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
    devLog.error("VAPID 키 생성 오류:", error);

    // 시스템 로그 기록 (실패)
    await createSystemLog(
      "VAPID_KEY_CREATE_FAILED",
      `VAPID 키 생성 실패.`,
      "error",
      undefined,
      "system",
      undefined,
      undefined,
      undefined,
      clientIP,
      userAgent
    );

    // API 에러 로그 기록
    await logApiError(
      "/api/push/vapid",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "VAPID_KEY_GENERATION_FAILED",
        message: "VAPID 키 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

// VAPID 키 조회
export async function GET(request: NextRequest) {
  // IP, userAgent 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    // 1. 시스템 설정에서 VAPID 키 조회
    const settings = await getSystemSettings();
    let publicKey = null;

    if (settings?.vapidPublicKey) {
      try {
        publicKey = settings.vapidPublicKey;
      } catch (e) {
        devLog.warn("VAPID 키 파싱 실패:", e);
      }
    }

    // 2. 시스템 설정에 없으면 환경변수에서 조회
    if (!publicKey) {
      publicKey = process.env.VAPID_PUBLIC_KEY;
    }

    // 3. 둘 다 없으면 404 반환
    if (!publicKey) {
      // 시스템 로그 기록 (조회 실패)
      await createSystemLog(
        "VAPID_KEY_RETRIEVE_FAILED",
        `VAPID 키가 설정되지 않았습니다.`,
        "warn",
        undefined,
        "system",
        undefined,
        undefined,
        undefined,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        {
          success: false,
          error: "VAPID_KEY_NOT_CONFIGURED",
          message: "VAPID 키가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    // 시스템 로그 기록 (조회 성공)
    await createSystemLog(
      "VAPID_KEY_RETRIEVED",
      `VAPID 키가 조회되었습니다.`,
      "info",
      undefined,
      "system",
      undefined,
      undefined,
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json({
      publicKey: settings.vapidPublicKey,
    });
  } catch (error) {
    devLog.error("VAPID 키 조회 실패:", error);

    // 시스템 로그 기록 (조회 실패)
    await createSystemLog(
      "VAPID_KEY_RETRIEVE_FAILED",
      `VAPID 키 조회 실패.`,
      "error",
      undefined,
      "system",
      undefined,
      undefined,
      undefined,
      clientIP,
      userAgent
    );

    // API 에러 로그 기록
    await logApiError(
      "/api/push/vapid",
      "GET",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "VAPID_KEY_FETCH_FAILED",
        message: "VAPID 키 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
