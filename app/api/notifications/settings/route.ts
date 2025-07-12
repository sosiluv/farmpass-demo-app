import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { logApiError } from "@/lib/utils/logging/system-log";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// GET: 알림 설정 조회
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    devLog.log("[API] /api/notifications/settings GET 요청 시작");

    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const supabase = await createClient();

    devLog.log("사용자 ID:", user.id);

    const { data: settings, error } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // 데이터가 없는 경우 (PGRST116 오류)
      if (error.code === "PGRST116") {
        devLog.log("알림 설정이 없음, 기본값 반환");
        return NextResponse.json(
          {
            id: null,
            user_id: user.id,
            notification_method: "push",
            visitor_alerts: true,
            notice_alerts: true,
            emergency_alerts: true,
            maintenance_alerts: true,
            kakao_user_id: null,
            is_active: false,
            created_at: null,
            updated_at: null,
          },
          {
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }

      // API 에러 로깅
      await logApiError(
        "/api/notifications/settings",
        "GET",
        error.message,
        user.id,
        {
          ip: clientIP,
          userAgent,
        }
      );

      // 알림 설정 조회 실패 로그
      await createSystemLog(
        "NOTIFICATION_SETTINGS_READ_FAILED",
        `알림 설정 조회 실패: ${error.message} (사용자 ID: ${user.id})`,
        "error",
        user.id,
        "notification",
        undefined,
        {
          error_code: error.code,
          error_message: error.message,
          user_id: user.id,
          status: "failed",
        },
        user.email,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        {
          success: false,
          error: "NOTIFICATION_SETTINGS_ERROR",
          message: "알림 설정 처리 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    devLog.log("알림 설정 조회 성공:", settings);
    return NextResponse.json(settings || {}, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    devLog.error("알림 설정 조회 중 예외 발생:", error);

    // API 에러 로깅
    await logApiError(
      "/api/notifications/settings",
      "GET",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    // 시스템 예외 로그
    await createSystemLog(
      "NOTIFICATION_SETTINGS_READ_SYSTEM_ERROR",
      `알림 설정 조회 시스템 오류: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      undefined,
      "notification",
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: "failed",
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "NOTIFICATION_SETTINGS_READ_SYSTEM_ERROR",
        message: "알림 설정 조회 중 시스템 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// PUT: 알림 설정 업데이트
export async function PUT(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const supabase = await createClient();

    const body = await request.json();
    const { data: existingSettings } = await supabase
      .from("user_notification_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;
    if (existingSettings) {
      // 기존 레코드 업데이트 시 updated_at 자동 설정
      const { updated_at, ...updateData } = body;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("user_notification_settings")
        .update({ ...updateData, updated_at: now })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        devLog.error("알림 설정 업데이트 오류:", error);

        // API 에러 로깅
        await logApiError(
          "/api/notifications/settings",
          "PUT",
          error.message,
          user.id,
          {
            ip: clientIP,
            userAgent,
          }
        );

        // 알림 설정 업데이트 실패 로그
        await createSystemLog(
          "NOTIFICATION_SETTINGS_UPDATE_FAILED",
          `알림 설정 업데이트 실패: ${error.message} (사용자 ID: ${user.id})`,
          "error",
          user.id,
          "notification",
          undefined,
          {
            error_code: error.code,
            error_message: error.message,
            user_id: user.id,
            action_type: "update",
            status: "failed",
          },
          user.email,
          clientIP,
          userAgent
        );

        return NextResponse.json(
          {
            success: false,
            error: "NOTIFICATION_SETTINGS_UPDATE_FAILED",
            message: "알림 설정 업데이트에 실패했습니다.",
          },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // 새 레코드 생성 시 id 필드 제외하고 타임스탬프 설정
      const { id, created_at, updated_at, ...insertData } = body;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("user_notification_settings")
        .insert([
          {
            ...insertData,
            user_id: user.id,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (error) {
        devLog.error("알림 설정 생성 오류:", error);

        // API 에러 로깅
        await logApiError(
          "/api/notifications/settings",
          "PUT",
          error.message,
          user.id,
          {
            ip: clientIP,
            userAgent,
          }
        );

        // 알림 설정 생성 실패 로그
        await createSystemLog(
          "NOTIFICATION_SETTINGS_CREATE_FAILED",
          `알림 설정 생성 실패: ${error.message} (사용자 ID: ${user.id})`,
          "error",
          user.id,
          "notification",
          undefined,
          {
            error_code: error.code,
            error_message: error.message,
            user_id: user.id,
            action_type: "create",
            status: "failed",
          },
          user.email,
          clientIP,
          userAgent
        );

        return NextResponse.json(
          {
            error: "NOTIFICATION_SETTINGS_CREATE_FAILED",
            message: "알림 설정 생성에 실패했습니다.",
          },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    devLog.error("알림 설정 업데이트 중 예외 발생:", error);

    // API 에러 로깅
    await logApiError(
      "/api/notifications/settings",
      "PUT",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    // 시스템 예외 로그
    await createSystemLog(
      "NOTIFICATION_SETTINGS_UPDATE_SYSTEM_ERROR",
      `알림 설정 업데이트 시스템 오류: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      undefined,
      "notification",
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: "failed",
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "NOTIFICATION_SETTINGS_UPDATE_SYSTEM_ERROR",
        message: "알림 설정 업데이트 중 시스템 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
