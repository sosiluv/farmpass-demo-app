import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import webpush from "web-push";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

// VAPID 키 설정 초기화
async function initializeVapidKeys() {
  try {
    const settings = await getSystemSettings();
    const publicKey = settings?.vapidPublicKey || process.env.VAPID_PUBLIC_KEY;
    const privateKey =
      settings?.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails("mailto:k331502@nate.com", publicKey, privateKey);
      return true;
    }
    return false;
  } catch (error) {
    devLog.error("VAPID 키 초기화 실패:", error);
    return false;
  }
}

/**
 * 푸시 발송 재시도 로직
 * @param subscription 푸시 구독 정보
 * @param payload 알림 페이로드
 * @param maxRetries 최대 재시도 횟수
 * @returns 발송 결과
 */
async function sendPushWithRetry(
  subscription: any,
  payload: string,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: any; retryCount?: number }> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, payload);

      return { success: true };
    } catch (error: any) {
      lastError = error;

      // 410 Gone이나 404 Not Found는 재시도하지 않음
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { success: false, error, retryCount: attempt };
      }

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프, 최대 5초
        await new Promise((resolve) => setTimeout(resolve, delay));
        devLog.warn(
          `푸시 발송 재시도 ${attempt}/${maxRetries} (구독 ID: ${subscription.id})`
        );
      }
    }
  }

  return { success: false, error: lastError, retryCount: maxRetries };
}

// 푸시 알림 발송
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const supabase = await createClient();

    // 서버 사이드 호출인지 확인
    const isServerSideCall = !userAgent || userAgent.includes("node-fetch");

    let user = null;

    if (!isServerSideCall) {
      // 클라이언트 호출인 경우 관리자 권한 인증 확인
      const authResult = await requireAuth(true);
      if (!authResult.success || !authResult.user) {
        return authResult.response!;
      }

      user = authResult.user;
    } else {
      // 서버 사이드 호출인 경우 시스템 사용자로 처리
      user = {
        id: undefined,
        email: process.env.ENV_COMPANY_EMAIL || "k331502@nate.com",
      };
      devLog.log("푸시 알림 API: 서버 사이드 호출 감지, 인증 우회");
    }

    const body = await request.json();
    const {
      title,
      message,
      farmId,
      targetUserIds,
      url = "/admin/dashboard",
      icon,
      badge,
      requireInteraction = false,
      notificationType = "visitor",
    } = body;

    // 입력 검증
    if (!title || !message || !notificationType) {
      await createSystemLog(
        "PUSH_NOTIFICATION_INVALID_INPUT",
        `푸시 알림 입력값 검증 실패 (필수값 누락). title: ${title}, message: ${message}, notificationType: ${notificationType}`,
        "warn",
        user?.id,
        "system",
        farmId || "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          farmId,
        },
        user?.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        { error: "제목, 메시지, 알림 유형은 필수입니다." },
        { status: 400 }
      );
    }

    if (
      !["visitor", "emergency", "maintenance", "notice"].includes(
        notificationType
      )
    ) {
      await createSystemLog(
        "PUSH_NOTIFICATION_INVALID_INPUT",
        `푸시 알림 입력값 검증 실패 (잘못된 알림 유형). notificationType: ${notificationType}`,
        "warn",
        user?.id,
        "system",
        farmId || "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          farmId,
        },
        user?.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        { error: "유효하지 않은 알림 유형입니다." },
        { status: 400 }
      );
    }

    // 시스템 설정 및 아이콘/배지 설정
    const settings = await getSystemSettings();
    const notificationIcon =
      icon ||
      (settings?.notificationIcon
        ? `/uploads/${settings.notificationIcon}`
        : "/icon-192x192.png");
    const notificationBadge =
      badge ||
      (settings?.notificationBadge
        ? `/uploads/${settings.notificationBadge}`
        : "/icon-192x192.png");

    // VAPID 키 초기화
    if (!(await initializeVapidKeys())) {
      await createSystemLog(
        "PUSH_NOTIFICATION_VAPID_INIT_FAILED",
        `VAPID 키 초기화 실패.`,
        "error",
        user?.id,
        "system",
        farmId || "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          farmId,
        },
        user?.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        { error: "VAPID 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 구독자 조회
    let subscriptionQuery = supabase.from("push_subscriptions").select("*");

    // 디버깅: 쿼리 조건 확인
    devLog.log("구독자 조회 조건:", {
      hasTargetUserIds: !!targetUserIds?.length,
      targetUserIdsCount: targetUserIds?.length || 0,
      hasFarmId: !!farmId,
      farmId,
      notificationType,
    });

    if (targetUserIds?.length > 0) {
      // 특정 사용자들에게만 발송
      subscriptionQuery = subscriptionQuery.in("user_id", targetUserIds);
      devLog.log("특정 사용자 대상 쿼리 실행:", { targetUserIds });
    } else if (farmId) {
      // 특정 농장에 속한 사용자들에게만 발송
      subscriptionQuery = subscriptionQuery.eq("farm_id", farmId);
      devLog.log("농장별 대상 쿼리 실행:", farmId);
    } else {
      // 브로드캐스트: 전체 구독자에게 발송
      subscriptionQuery = subscriptionQuery.is("farm_id", null);
      devLog.log("브로드캐스트 쿼리 실행");
    }

    const { data: subscriptions, error: subscriptionError } =
      await subscriptionQuery;

    if (subscriptionError) {
      await createSystemLog(
        "PUSH_NOTIFICATION_SUBSCRIBER_FETCH_FAILED",
        `푸시 구독자 조회 실패.`,
        "error",
        user?.id,
        "system",
        farmId || "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          farmId,
          subscriptionError: subscriptionError.message,
        },
        user?.email,
        clientIP,
        userAgent
      );
      devLog.error("구독자 조회 오류:", subscriptionError);
      return NextResponse.json(
        { error: "구독자 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!subscriptions?.length) {
      // 구독자가 없는 경우 로그 기록
      await createSystemLog(
        "PUSH_NOTIFICATION_NO_SUBSCRIBERS",
        `푸시 알림 발송 시도했으나 구독자가 없습니다. 알림 유형: ${notificationType}${
          targetUserIds ? `, 대상 사용자: ${targetUserIds.length}명` : ""
        }`,
        "warn",
        user.id,
        "system",
        farmId || "all",
        {
          notification_type: notificationType,
          target_user_ids: targetUserIds,
          farm_id: farmId,
          title,
          message,
        },
        user.email,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        { message: "발송할 구독자가 없습니다.", sentCount: 0 },
        { status: 200 }
      );
    }

    // 구독자의 사용자 ID 추출 (중복 제거)
    const userIds = Array.from(
      new Set(subscriptions.map((sub) => sub.user_id))
    );

    // 알림 설정 조회
    const { data: notificationSettings, error: settingsError } = await supabase
      .from("user_notification_settings")
      .select("*")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (settingsError) {
      await createSystemLog(
        "PUSH_NOTIFICATION_SETTINGS_FETCH_FAILED",
        `알림 설정 조회 실패.`,
        "error",
        user?.id,
        "system",
        farmId || "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          farmId,
          settingsError: settingsError.message,
        },
        user?.email,
        clientIP,
        userAgent
      );
      devLog.error("알림 설정 조회 오류:", settingsError);
      return NextResponse.json(
        { error: "알림 설정 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 설정 맵 생성 (빠른 조회를 위해)
    const settingsMap = new Map();
    notificationSettings?.forEach((setting) => {
      settingsMap.set(setting.user_id, setting);
    });

    // 알림 설정에 따라 필터링
    const filteredSubscriptions = subscriptions.filter((subscription) => {
      const userSettings = settingsMap.get(subscription.user_id);

      // 알림 설정이 없는 경우 기본적으로 알림 발송하지 않음
      if (!userSettings) {
        devLog.log(
          "알림 설정 없음, 기본값으로 발송하지 않음:",
          subscription.user_id
        );
        return false;
      }

      // 알림 설정이 있고 비활성화된 경우에만 제외
      if (userSettings.is_active === false) {
        devLog.log("알림 설정 명시적으로 비활성화됨:", subscription.user_id);
        return false;
      }

      // 알림 유형별 설정 확인
      const alertField = `${notificationType}_alerts`;
      const isEnabled = userSettings[alertField] !== false;

      return isEnabled;
    });

    if (!filteredSubscriptions || filteredSubscriptions.length === 0) {
      // 알림 설정으로 인해 필터링된 경우 로그 기록
      await createSystemLog(
        "PUSH_NOTIFICATION_FILTERED_OUT",
        `푸시 알림 발송 시도했으나 알림 설정으로 인해 모든 구독자가 필터링되었습니다. 전체 구독자: ${subscriptions.length}명, 알림 유형: ${notificationType}`,
        "warn",
        user.id,
        "system",
        farmId || "all",
        {
          notification_type: notificationType,
          total_subscribers: subscriptions.length,
          filtered_subscribers: 0,
          target_user_ids: targetUserIds,
          farm_id: farmId,
          title,
          message,
          settings_summary: {
            total_settings: userIds.length,
            active_settings: notificationSettings?.length || 0,
          },
        },
        user.email,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        { message: "발송할 구독자가 없습니다.", sentCount: 0 },
        { status: 200 }
      );
    }

    // 푸시 알림 페이로드 생성
    const notificationPayload = {
      title,
      body: message,
      icon: notificationIcon,
      badge: notificationBadge,
      tag: `farm-notification-${notificationType}-${Date.now()}`,
      requireInteraction:
        requireInteraction || settings?.pushRequireInteraction || false,
      silent: !(settings?.pushSoundEnabled || false),
      vibrate: settings?.pushVibrateEnabled ? [200, 100, 200] : undefined,
      actions: [
        {
          action: "view",
          title: "확인하기",
          icon: notificationIcon,
        },
        {
          action: "dismiss",
          title: "닫기",
        },
      ],
      data: {
        url,
        farmId,
        timestamp: Date.now(),
        type: notificationType,
      },
    };

    // 필터링된 구독자에게만 푸시 알림 발송
    const sendPromises = filteredSubscriptions.map(async (subscription) => {
      try {
        devLog.log("푸시 알림 발송 시도:", {
          subscriptionId: subscription.id,
          user_id: subscription.user_id,
          farm_id: subscription.farm_id,
          endpoint: subscription.endpoint,
        });
        const result = await sendPushWithRetry(
          subscription,
          JSON.stringify(notificationPayload)
        );
        return {
          success: result.success,
          subscriptionId: subscription.id,
          error: result.error,
          retryCount: result.retryCount,
        };
      } catch (error: any) {
        devLog.error(`푸시 발송 실패 (구독 ID: ${subscription.id}):`, error);

        // 410 Gone 에러인 경우 구독 삭제
        if (error.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }

        return {
          success: false,
          subscriptionId: subscription.id,
          error: error.message || "알 수 없는 오류",
          statusCode: error.statusCode,
          userId: subscription.user_id,
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // 실패한 경우 요약 로그 기록
    if (failureCount > 0) {
      // 실패 통계 수집
      const failureStats = results
        .filter((r) => !r.success)
        .reduce((acc, result) => {
          const errorType =
            result.statusCode === 410
              ? "410_GONE"
              : result.statusCode === 404
              ? "404_NOT_FOUND"
              : result.statusCode === 429
              ? "429_RATE_LIMIT"
              : "OTHER";

          acc[errorType] = (acc[errorType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      await createSystemLog(
        "PUSH_NOTIFICATION_SEND_FAILED",
        `푸시 알림 발송 중 ${failureCount}건 실패: ${Object.entries(
          failureStats
        )
          .map(([type, count]) => `${type}: ${count}건`)
          .join(", ")}`,
        "warn",
        user.id,
        "system",
        farmId || "all",
        {
          notification_type: notificationType,
          title,
          message,
          total_attempts: filteredSubscriptions.length,
          success_count: successCount,
          failure_count: failureCount,
          failure_stats: failureStats,
          target_user_ids: targetUserIds,
          farm_id: farmId,
          // 첫 번째 실패 사례만 상세 정보 포함
          first_failure_example: results.find((r) => !r.success)
            ? {
                subscription_id: results.find((r) => !r.success)
                  ?.subscriptionId,
                user_id: results.find((r) => !r.success)?.userId,
                error_message: results.find((r) => !r.success)?.error,
                status_code: results.find((r) => !r.success)?.statusCode,
              }
            : null,
        },
        user.email,
        clientIP,
        userAgent
      );
    }

    // 시스템 로그 기록
    await createSystemLog(
      "PUSH_NOTIFICATION_SENT",
      `푸시 알림이 발송되었습니다. 성공: ${successCount}, 실패: ${failureCount}`,
      "info",
      user.id,
      "system",
      farmId || "all",
      {
        notification_type: notificationType,
        title,
        message,
        total_subscribers: subscriptions.length,
        filtered_subscribers: filteredSubscriptions.length,
        success_count: successCount,
        failure_count: failureCount,
        target_user_ids: targetUserIds,
        farm_id: farmId,
        settings_summary: {
          total_settings: userIds.length,
          active_settings: notificationSettings?.length || 0,
        },
        payload_info: {
          has_icon: !!notificationIcon,
          has_badge: !!notificationBadge,
          require_interaction:
            requireInteraction || settings?.pushRequireInteraction || false,
          sound_enabled: settings?.pushSoundEnabled || false,
          vibrate_enabled: settings?.pushVibrateEnabled || false,
        },
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        message: "푸시 알림 발송이 완료되었습니다.",
        sentCount: successCount,
        failureCount,
        results,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("푸시 발송 API 오류:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/push/send",
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
