import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { logApiError } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";

/**
 * 푸시 구독 데이터 무결성 검증
 * @param subscription 구독 데이터
 * @returns 검증 결과
 */
function validateSubscriptionData(subscription: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!subscription?.endpoint) {
    errors.push("endpoint가 필요합니다.");
  }

  if (!subscription?.keys?.p256dh) {
    errors.push("p256dh 키가 필요합니다.");
  }

  if (!subscription?.keys?.auth) {
    errors.push("auth 키가 필요합니다.");
  }

  // endpoint URL 형식 검증
  if (subscription?.endpoint && !subscription.endpoint.startsWith("https://")) {
    errors.push("endpoint는 HTTPS URL이어야 합니다.");
  }

  // 키 길이 검증 (기본적인 형식 검증)
  if (subscription?.keys?.p256dh && subscription.keys.p256dh.length < 80) {
    errors.push("p256dh 키가 너무 짧습니다.");
  }

  if (subscription?.keys?.auth && subscription.keys.auth.length < 20) {
    errors.push("auth 키가 너무 짧습니다.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 푸시 구독 등록
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const body = await request.json();
    const { subscription } = body;
    // farmId는 더 이상 사용하지 않음 - 항상 전체 구독으로 통합

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "INVALID_SUBSCRIPTION_DATA" },
        { status: 400 }
      );
    }

    // 구독 데이터 무결성 검증
    const validation = validateSubscriptionData(subscription);
    if (!validation.valid) {
      devLog.error("구독 데이터 검증 실패:", validation.errors);
      return NextResponse.json(
        {
          error: "SUBSCRIPTION_VALIDATION_FAILED",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // 기존 구독 확인 및 삭제 (전체 구독만)
    const { data: existingSubscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("farm_id", null); // 항상 전체 구독

    // 기존 구독이 있으면 모두 삭제 (디바이스당 하나만 유지)
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      devLog.log(
        `기존 구독 ${existingSubscriptions.length}개 발견, 삭제 후 새로 생성`
      );

      // 기존 구독 삭제
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("farm_id", null);

      if (deleteError) {
        devLog.error("기존 구독 삭제 오류:", deleteError);
        return NextResponse.json(
          { error: "SUBSCRIPTION_DELETE_FAILED" },
          { status: 500 }
        );
      }
    }

    // 새 구독 저장 (항상 전체 구독)
    const { data: newSubscription, error: insertError } = await supabase
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        farm_id: null, // 항상 전체 구독
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      devLog.error("푸시 구독 저장 오류:", insertError);
      return NextResponse.json(
        { error: "SUBSCRIPTION_SAVE_FAILED" },
        { status: 500 }
      );
    }

    // user_notification_settings에 기본 설정 자동 생성 (없는 경우에만)
    const { data: existingSettings } = await supabase
      .from("user_notification_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existingSettings) {
      const now = new Date().toISOString();
      const { error: settingsError } = await supabase
        .from("user_notification_settings")
        .insert({
          user_id: user.id,
          notification_method: "push",
          visitor_alerts: true,
          notice_alerts: true,
          emergency_alerts: true,
          maintenance_alerts: true,
          is_active: true,
          created_at: now,
          updated_at: now,
        });

      if (settingsError) {
        devLog.warn("알림 설정 자동 생성 실패:", settingsError);
        // 구독은 성공했으므로 경고만 기록하고 계속 진행

        // 알림 설정 생성 실패 시 시스템 로그 기록
        await createSystemLog(
          "NOTIFICATION_SETTINGS_CREATION_FAILED",
          `푸시 구독 시 알림 설정 자동 생성에 실패했습니다.`,
          "warn",
          user.id,
          "system",
          newSubscription.id,
          {
            error: settingsError.message,
            subscription_id: newSubscription.id,
            user_id: user.id,
          },
          user.email,
          clientIP,
          userAgent
        );
      }
      // 성공 시는 로그 제거 - 정상적인 동작이므로 로그 불필요
    }

    // 푸시 구독 성공 시 시스템 로그 기록 (기본 동작)
    await createSystemLog(
      "PUSH_SUBSCRIPTION_CREATED",
      `사용자가 푸시 알림을 구독했습니다. ${
        newSubscription.endpoint
          ? ` (엔드포인트: ${newSubscription.endpoint})`
          : ""
      }`,
      "info",
      user.id,
      "system",
      newSubscription.id,
      undefined,
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        message: "푸시 알림 구독이 완료되었습니다.",
        subscription: newSubscription,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    devLog.error("푸시 구독 API 오류:", error);
    // API 에러 로그 기록
    await logApiError(
      "/api/push/subscription",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 푸시 구독 조회
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const supabase = await createClient();

    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId");

    let query = supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (farmId) {
      query = query.eq("farm_id", farmId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      devLog.error("푸시 구독 조회 오류:", error);
      return NextResponse.json(
        { error: "SUBSCRIPTION_FETCH_FAILED" },
        { status: 500 }
      );
    }

    // 구독 유효성 검사 (만료된 구독 감지)
    let expiredCount = 0;
    const validSubscriptions = [];

    if (subscriptions && subscriptions.length > 0) {
      // VAPID 키 설정 확인
      const { data: settings } = await supabase
        .from("system_settings")
        .select("vapid_public_key, vapid_private_key")
        .single();

      if (settings?.vapid_public_key && settings?.vapid_private_key) {
        // web-push 설정
        const webpush = require("web-push");
        webpush.setVapidDetails(
          "mailto:k331502@nate.com",
          settings.vapid_public_key,
          settings.vapid_private_key
        );

        // 각 구독의 유효성 검사
        for (const subscription of subscriptions) {
          try {
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            // 빈 알림으로 유효성 테스트 (실제로는 발송하지 않음)
            const testPayload = {
              title: "연결 테스트",
              body: "구독 유효성 검사",
              tag: "validity-check",
              silent: true, // 무음 알림
            };

            // 실제로는 발송하지 않고 구독 객체만 검증
            if (
              subscription.endpoint &&
              subscription.p256dh &&
              subscription.auth
            ) {
              validSubscriptions.push(subscription);
            } else {
              throw new Error("구독 정보 불완전");
            }
          } catch (error: any) {
            devLog.log(
              `구독 유효성 검사 실패 (ID: ${subscription.id}):`,
              error.message
            );

            // 만료된 구독으로 간주하고 삭제
            expiredCount++;
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);

            devLog.log(`만료된 구독 삭제됨 (ID: ${subscription.id})`);
          }
        }
      } else {
        // VAPID 키가 없으면 모든 구독을 유효한 것으로 간주
        validSubscriptions.push(...subscriptions);
      }
    }

    const response = {
      subscriptions: validSubscriptions,
      ...(expiredCount > 0 && { expiredCount }),
    };

    // 구독 조회 성공 시 시스템 로그 기록
    await createSystemLog(
      "PUSH_SUBSCRIPTION_GET",
      `사용자가 푸시 알림 구독을 조회했습니다.`,
      "info",
      user.id,
      "system",
      undefined,
      undefined,
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(response, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    devLog.error("푸시 구독 조회 API 오류:", error);
    // API 에러 로그 기록
    await logApiError(
      "/api/push/subscription",
      "GET",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );
    return NextResponse.json(
      { error: "SUBSCRIPTION_GET_SYSTEM_ERROR" },
      { status: 500 }
    );
  }
}

// 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const supabase = await createClient();

    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "MISSING_ENDPOINT" }, { status: 400 });
    }

    // 구독 삭제
    // 전체 구독 해제 - 해당 endpoint의 모든 구독 삭제 (전체 + 모든 농장별)
    devLog.log(`전체 구독 해제: endpoint ${endpoint}의 모든 구독 삭제`);

    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);

    if (deleteError) {
      devLog.error("전체 푸시 구독 삭제 오류:", deleteError);
      return NextResponse.json(
        { error: "SUBSCRIPTION_UNSUBSCRIBE_FAILED" },
        { status: 500 }
      );
    }

    // 시스템 로그 기록
    await createSystemLog(
      "PUSH_SUBSCRIPTION_DELETED",
      `사용자가 푸시 알림 구독을 해제했습니다.${
        endpoint ? ` (엔드포인트: ${endpoint})` : ""
      }`,
      "info",
      user.id,
      "system",
      endpoint,
      undefined,
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { message: "푸시 알림 구독이 해제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    devLog.error("푸시 구독 해제 API 오류:", error);
    // API 에러 로그 기록
    await logApiError(
      "/api/push/subscription",
      "DELETE",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
