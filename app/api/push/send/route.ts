import { NextRequest, NextResponse } from "next/server";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import webpush from "web-push";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

// VAPID 키 설정 초기화
async function initializeVapidKeys() {
  try {
    // 1. 환경변수 우선 (null 대신 undefined)
    const publicKey =
      process.env.VAPID_PUBLIC_KEY ||
      (await getSystemSettings())?.vapidPublicKey ||
      undefined;
    const privateKey =
      process.env.VAPID_PRIVATE_KEY ||
      (await getSystemSettings())?.vapidPrivateKey ||
      undefined;

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
      targetUserIds,
      url = "/admin/dashboard",
      icon,
      badge,
      requireInteraction = false,
      notificationType,
    } = body;

    // 입력 검증
    if (!title || !message || !notificationType) {
      await createSystemLog(
        "PUSH_NOTIFICATION_INVALID_INPUT",
        `푸시 알림 입력값 검증 실패 (필수값 누락). title: ${title}, message: ${message}, notificationType: ${notificationType}`,
        "warn",
        user?.id,
        "system",
        "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
        },
        user?.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_REQUIRED_FIELDS",
          message: "필수 입력 항목이 누락되었습니다.",
        },
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
        "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
        },
        user?.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_NOTIFICATION_TYPE",
          message: "유효하지 않은 알림 유형입니다.",
        },
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
        "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
        },
        user?.email,
        clientIP,
        userAgent
      );
      return NextResponse.json(
        {
          success: false,
          error: "VAPID_KEYS_NOT_SET",
          message: "VAPID 키가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    // 구독자 조회
    let subscriptions;

    // 디버깅: 쿼리 조건 확인
    devLog.log("구독자 조회 조건:", {
      hasTargetUserIds: !!targetUserIds?.length,
      targetUserIdsCount: targetUserIds?.length || 0,
      notificationType,
    });

    try {
      if (targetUserIds?.length > 0) {
        // 특정 사용자들에게만 발송 (활성 구독만)
        subscriptions = await prisma.push_subscriptions.findMany({
          where: {
            user_id: {
              in: targetUserIds,
            },
            is_active: true, // 활성 구독만
            deleted_at: null, // 삭제되지 않은 구독만
          },
        });
        devLog.log("특정 사용자 대상 쿼리 실행:", {
          targetUserIds,
          foundSubscriptions: subscriptions.length,
        });
      } else {
        // 브로드캐스트: 모든 활성 구독자에게 발송
        subscriptions = await prisma.push_subscriptions.findMany({
          where: {
            is_active: true, // 활성 구독만
            deleted_at: null, // 삭제되지 않은 구독만
          },
        });
        devLog.log("브로드캐스트 쿼리 실행", {
          foundSubscriptions: subscriptions.length,
        });
      }
    } catch (error) {
      await createSystemLog(
        "PUSH_NOTIFICATION_SUBSCRIBER_FETCH_FAILED",
        `푸시 구독자 조회 실패.`,
        "error",
        user?.id,
        "system",
        "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          subscriptionError:
            error instanceof Error ? error.message : String(error),
        },
        user?.email,
        clientIP,
        userAgent
      );
      devLog.error("구독자 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: "SUBSCRIBER_FETCH_FAILED",
          message: "구독자 조회에 실패했습니다.",
        },
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
        "all",
        {
          notification_type: notificationType,
          target_user_ids: targetUserIds,
          title,
          message,
        },
        user.email,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        {
          message:
            "발송할 구독자가 없습니다. (푸시 알림을 구독한 사용자가 없음)",
          sentCount: 0,
        },
        { status: 200 }
      );
    }

    // 구독자의 사용자 ID 추출 (중복 제거)
    const userIds = Array.from(
      new Set(subscriptions.map((sub) => sub.user_id))
    );

    // 알림 설정 조회
    let notificationSettings;
    try {
      notificationSettings = await prisma.userNotificationSettings.findMany({
        where: {
          user_id: {
            in: userIds,
          },
          is_active: true,
        },
      });
    } catch (error) {
      await createSystemLog(
        "PUSH_NOTIFICATION_SETTINGS_FETCH_FAILED",
        `알림 설정 조회 실패.`,
        "error",
        user?.id,
        "system",
        "all",
        {
          title,
          message,
          notificationType,
          targetUserIds,
          settingsError: error instanceof Error ? error.message : String(error),
        },
        user?.email,
        clientIP,
        userAgent
      );
      devLog.error("알림 설정 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: "NOTIFICATION_SETTINGS_FETCH_FAILED",
          message: "알림 설정을 불러올 수 없습니다.",
        },
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
        "all",
        {
          notification_type: notificationType,
          total_subscribers: subscriptions.length,
          filtered_subscribers: 0,
          target_user_ids: targetUserIds,
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
        {
          message:
            "발송할 구독자가 없습니다. (알림 설정으로 인해 모든 구독자가 필터링됨)",
          sentCount: 0,
        },
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
          endpoint: subscription.endpoint,
          currentFailCount: subscription.fail_count || 0,
        });

        const result = await sendPushWithRetry(
          subscription,
          JSON.stringify(notificationPayload)
        );

        // 성공 시 fail_count 초기화 및 last_used_at 업데이트
        if (result.success) {
          await prisma.push_subscriptions.update({
            where: { id: subscription.id },
            data: {
              fail_count: 0,
              last_used_at: new Date(),
              updated_at: new Date(),
            },
          });
        }

        return {
          success: result.success,
          subscriptionId: subscription.id,
          error: result.error,
          retryCount: result.retryCount,
        };
      } catch (error: any) {
        devLog.error(`푸시 발송 실패 (구독 ID: ${subscription.id}):`, error);

        // 실패 시 fail_count 증가 및 last_fail_at 업데이트
        const newFailCount = (subscription.fail_count || 0) + 1;

        try {
          await prisma.push_subscriptions.update({
            where: { id: subscription.id },
            data: {
              fail_count: newFailCount,
              last_fail_at: new Date(),
              updated_at: new Date(),
            },
          });
        } catch (updateError) {
          devLog.error("fail_count 업데이트 실패:", updateError);
        }

        // 410 Gone 에러이거나 fail_count가 5회 이상인 경우 구독 비활성화
        if (error.statusCode === 410 || newFailCount >= 5) {
          try {
            await prisma.push_subscriptions.update({
              where: { id: subscription.id },
              data: {
                is_active: false,
                deleted_at: new Date(),
                updated_at: new Date(),
              },
            });

            devLog.log(
              `구독 비활성화됨 (ID: ${subscription.id}, 이유: ${
                error.statusCode === 410 ? "410_GONE" : "FAIL_COUNT_EXCEEDED"
              })`
            );
          } catch (deactivateError) {
            devLog.error("구독 비활성화 실패:", deactivateError);
          }
        }

        return {
          success: false,
          subscriptionId: subscription.id,
          error: "PUSH_SEND_FAILED",
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
        "all",
        {
          notification_type: notificationType,
          title,
          message,
          total_attempts: filteredSubscriptions.length,
          success_count: successCount,
          failure_count: failureCount,
          failure_stats: failureStats,
          target_user_ids: targetUserIds,
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
      "all",
      {
        notification_type: notificationType,
        title,
        message,
        total_subscribers: subscriptions.length,
        filtered_subscribers: filteredSubscriptions.length,
        success_count: successCount,
        failure_count: failureCount,
        target_user_ids: targetUserIds,
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
        message: `푸시 알림이 성공적으로 발송되었습니다. (성공: ${successCount}명, 실패: ${failureCount}명)`,
        sentCount: successCount,
        failureCount,
        totalAttempts: filteredSubscriptions.length,
        stats: {
          success: successCount,
          failure: failureCount,
          total: filteredSubscriptions.length,
          successRate:
            filteredSubscriptions.length > 0
              ? Math.round((successCount / filteredSubscriptions.length) * 100)
              : 0,
        },
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
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
