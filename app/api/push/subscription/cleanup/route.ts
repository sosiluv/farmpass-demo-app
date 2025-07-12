import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import webpush from "web-push";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

// 만료된 푸시 구독 정리
export async function POST(request: NextRequest) {
  // IP, userAgent 추출
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

    // 요청 본문에서 검사 타입 확인
    const body = await request.json().catch(() => ({}));
    const { realTimeCheck = false } = body;

    // VAPID 키 설정 확인 (실시간 검사 시에만 필요)
    if (realTimeCheck) {
      const settings = await getSystemSettings();
      if (!settings?.vapidPublicKey || !settings?.vapidPrivateKey) {
        return NextResponse.json(
          { error: "실시간 검사를 위해 VAPID 키가 필요합니다." },
          { status: 500 }
        );
      }

      // VAPID 키 설정
      webpush.setVapidDetails(
        "mailto:k331502@nate.com",
        settings.vapidPublicKey,
        settings.vapidPrivateKey
      );
    }

    // 사용자의 모든 구독 조회
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (subscriptionError) {
      devLog.error("구독 조회 오류:", subscriptionError);
      return NextResponse.json(
        { error: "SUBSCRIPTION_CLEANUP_FETCH_FAILED" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // 정리할 구독 없음 로그
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP_NONE",
        `정리할 구독이 없습니다. (방식: ${
          realTimeCheck ? "realtime" : "basic"
        })`,
        "info",
        user.id,
        "system",
        "cleanup",
        undefined,
        user.email,
        clientIP,
        userAgent
      );
      return NextResponse.json({
        message: "정리할 구독이 없습니다.",
        cleanedCount: 0,
      });
    }

    // 만료된 구독 검사 및 정리
    let cleanedCount = 0;
    let validCount = 0;

    if (realTimeCheck) {
      // 실시간 검사: 실제 무음 알림 발송으로 검사
      const testPayload = {
        title: "",
        body: "",
        tag: "validity-check-silent",
        silent: true,
        requireInteraction: false,
        icon: "/icon-192x192.svg",
        badge: "/icon-192x192.svg",
        data: {
          isValidityCheck: true,
          timestamp: Date.now(),
        },
        actions: [],
      };

      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          // 무음 알림 발송으로 유효성 검사
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(testPayload)
          );

          validCount++;
          devLog.log(`구독 유효함 (실시간 검사) (ID: ${subscription.id})`);
        } catch (error: any) {
          devLog.log(
            `구독 만료 감지 (실시간 검사) (ID: ${subscription.id}):`,
            error.statusCode
          );

          // 410 Gone 에러 또는 기타 만료 관련 오류인 경우 삭제
          if (error.statusCode === 410 || error.statusCode === 400) {
            cleanedCount++;
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
            devLog.log(
              `만료된 구독 삭제됨 (실시간 검사) (ID: ${subscription.id})`
            );
          }
        }
      }
    } else {
      // 기본 검사: 구독 정보 유효성만 검사 (알림 발송 없음)
      for (const subscription of subscriptions) {
        try {
          // 구독 정보 유효성 기본 검사
          if (
            !subscription.endpoint ||
            !subscription.p256dh ||
            !subscription.auth
          ) {
            devLog.log(`구독 정보 불완전 (ID: ${subscription.id})`);
            cleanedCount++;
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
            continue;
          }

          // 엔드포인트 URL 유효성 검사
          try {
            const url = new URL(subscription.endpoint);
            // FCM, Mozilla, Microsoft 등 알려진 푸시 서비스 확인
            const validDomains = [
              "fcm.googleapis.com",
              "updates.push.services.mozilla.com",
              "wns2-*.notify.windows.com",
              "push.apple.com",
            ];

            const isValidDomain = validDomains.some((domain) => {
              if (domain.includes("*")) {
                const pattern = domain.replace("*", ".*");
                return new RegExp(pattern).test(url.hostname);
              }
              return url.hostname === domain;
            });

            if (!isValidDomain) {
              devLog.log(
                `알 수 없는 푸시 서비스 도메인 (ID: ${subscription.id}): ${url.hostname}`
              );
            }

            validCount++;
            devLog.log(`구독 유효함 (기본 검사) (ID: ${subscription.id})`);
          } catch (urlError) {
            devLog.log(
              `잘못된 엔드포인트 URL (ID: ${subscription.id}):`,
              subscription.endpoint
            );
            cleanedCount++;
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
          }
        } catch (error: any) {
          devLog.log(
            `구독 검사 실패 (기본 검사) (ID: ${subscription.id}):`,
            error.message
          );
          cleanedCount++;
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }
      }
    }

    // 시스템 로그 기록
    if (cleanedCount > 0) {
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP",
        `만료된 푸시 구독이 정리되었습니다. 정리된 구독 수: ${cleanedCount} (방식: ${
          realTimeCheck ? "realtime" : "basic"
        })`,
        "info",
        user.id,
        "system",
        "cleanup",
        undefined,
        user.email,
        clientIP,
        userAgent
      );
    } else {
      // 모든 구독이 유효한 경우도 로그
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP_ALL_VALID",
        `모든 푸시 구독이 유효합니다. (방식: ${
          realTimeCheck ? "realtime" : "basic"
        }, 검사: ${subscriptions.length}, 유효: ${validCount})`,
        "info",
        user.id,
        "system",
        "cleanup",
        undefined,
        user.email,
        clientIP,
        userAgent
      );
    }

    return NextResponse.json({
      message:
        cleanedCount > 0
          ? `${cleanedCount}개의 ${
              realTimeCheck ? "만료된" : "잘못된"
            } 구독이 정리되었습니다.`
          : "모든 구독이 유효합니다.",
      cleanedCount,
      validCount,
      totalChecked: subscriptions.length,
      checkType: realTimeCheck ? "realtime" : "basic",
    });
  } catch (error) {
    devLog.error("구독 정리 API 오류:", error);
    // API 에러 로그 기록 (logApiError 사용)
    await logApiError(
      "/api/push/subscription/cleanup",
      "POST",
      error instanceof Error ? error : String(error),
      undefined, // userId
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      { error: "구독 정리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
