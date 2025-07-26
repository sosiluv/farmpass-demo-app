import { NextRequest, NextResponse } from "next/server";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import webpush from "web-push";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import type {
  SubscriptionCleanupOptions,
  SubscriptionCleanupResult,
} from "@/lib/types/notification";

// 만료된 푸시 구독 정리
export async function POST(request: NextRequest) {
  // IP, userAgent 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    // 요청 본문에서 검사 타입 확인
    const body = (await request
      .json()
      .catch(() => ({}))) as SubscriptionCleanupOptions;

    // 시스템 설정에서 기본값 가져오기
    const settings = await getSystemSettings();

    const {
      realTimeCheck = false,
      forceDelete = settings.subscriptionForceDelete, // 시스템 설정 기본값 사용
      failCountThreshold = settings.subscriptionFailCountThreshold, // 시스템 설정 기본값 사용
      cleanupInactive = settings.subscriptionCleanupInactive, // 시스템 설정 기본값 사용
      deleteAfterDays = settings.subscriptionCleanupDays, // 시스템 설정 기본값 사용
    } = body;

    // VAPID 키 설정 확인 (실시간 검사 시에만 필요)
    if (realTimeCheck) {
      // 환경변수 우선, 없으면 시스템 설정에서 조회
      const envPublicKey = process.env.VAPID_PUBLIC_KEY;
      const envPrivateKey = process.env.VAPID_PRIVATE_KEY;
      let publicKey: string | undefined = envPublicKey;
      let privateKey: string | undefined = envPrivateKey;
      if (!publicKey || !privateKey) {
        const settings = await getSystemSettings();
        publicKey = publicKey || settings?.vapidPublicKey || undefined;
        privateKey = privateKey || settings?.vapidPrivateKey || undefined;
      }
      if (!publicKey || !privateKey) {
        return NextResponse.json(
          {
            success: false,
            error: "VAPID_KEY_REQUIRED_FOR_REALTIME",
            message: "실시간 검사를 위해 VAPID 키가 필요합니다.",
          },
          { status: 500 }
        );
      }
      webpush.setVapidDetails("mailto:k331502@nate.com", publicKey, privateKey);
    }

    // 사용자의 모든 구독 조회 (삭제되지 않은 구독만)
    const subscriptions = await prisma.push_subscriptions.findMany({
      where: {
        user_id: user.id,
        deleted_at: null, // 삭제되지 않은 구독만
      },
    });

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
        {
          user_id: user.id,
          user_email: user.email,
          action_type: "push_notification_cleanup",
        },
        user.email,
        clientIP,
        userAgent
      );
      return NextResponse.json({
        message: "정리할 구독이 없습니다.",
        cleanedCount: 0,
        validCount: 0,
        totalChecked: 0,
        checkType: realTimeCheck ? "realtime" : "basic",
        stats: {
          failCountCleaned: 0,
          inactiveCleaned: 0,
          expiredCleaned: 0,
          forceDeleted: 0,
          oldSoftDeletedCleaned: 0,
        },
      });
    }

    // 만료된 구독 검사 및 정리
    let cleanedCount = 0;
    let validCount = 0;
    let failCountCleaned = 0;
    let inactiveCleaned = 0;
    let expiredCleaned = 0;
    let forceDeleted = 0;
    let oldSoftDeletedCleaned = 0;

    // 1. fail_count 기반 정리 (먼저 처리)
    if (failCountThreshold > 0) {
      const highFailCountSubscriptions = subscriptions.filter(
        (sub: any) => (sub.fail_count || 0) >= failCountThreshold
      );

      for (const subscription of highFailCountSubscriptions) {
        try {
          if (forceDelete) {
            // 강제 삭제
            await prisma.push_subscriptions.delete({
              where: { id: subscription.id },
            });
            forceDeleted++;
          } else {
            // soft delete
            await prisma.push_subscriptions.update({
              where: { id: subscription.id },
              data: {
                is_active: false,
                deleted_at: new Date(),
                updated_at: new Date(),
              },
            });
          }
          failCountCleaned++;
          cleanedCount++;
          devLog.log(
            `fail_count 임계값 초과로 정리됨 (ID: ${subscription.id}, fail_count: ${subscription.fail_count})`
          );
        } catch (error) {
          devLog.error(
            `fail_count 기반 정리 실패 (ID: ${subscription.id}):`,
            error
          );
        }
      }
    }

    // 2. 오래된 soft delete 구독 정리 (deleteAfterDays 설정된 경우)
    if (deleteAfterDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - deleteAfterDays);

      const oldSoftDeletedSubscriptions =
        await prisma.push_subscriptions.findMany({
          where: {
            user_id: user.id,
            deleted_at: {
              not: null,
              lt: cutoffDate,
            },
          },
        });

      for (const subscription of oldSoftDeletedSubscriptions) {
        try {
          // 완전 삭제 (이미 soft delete된 구독이므로)
          await prisma.push_subscriptions.delete({
            where: { id: subscription.id },
          });
          forceDeleted++;
          cleanedCount++;
          oldSoftDeletedCleaned++;
          devLog.log(
            `오래된 soft delete 구독 완전 삭제됨 (ID: ${subscription.id}, deleted_at: ${subscription.deleted_at})`
          );
        } catch (error) {
          devLog.error(
            `오래된 soft delete 구독 삭제 실패 (ID: ${subscription.id}):`,
            error
          );
        }
      }
    }

    // 3. 비활성 구독 정리
    if (cleanupInactive) {
      const inactiveSubscriptions = subscriptions.filter(
        (sub: any) => sub.is_active === false
      );

      for (const subscription of inactiveSubscriptions) {
        try {
          if (forceDelete) {
            // 강제 삭제
            await prisma.push_subscriptions.delete({
              where: { id: subscription.id },
            });
            forceDeleted++;
          } else {
            // soft delete
            await prisma.push_subscriptions.update({
              where: { id: subscription.id },
              data: {
                deleted_at: new Date(),
                updated_at: new Date(),
              },
            });
          }
          inactiveCleaned++;
          cleanedCount++;
          devLog.log(`비활성 구독 정리됨 (ID: ${subscription.id})`);
        } catch (error) {
          devLog.error(
            `비활성 구독 정리 실패 (ID: ${subscription.id}):`,
            error
          );
        }
      }
    }

    // 3. 실시간 검사 또는 기본 검사
    const remainingSubscriptions = subscriptions.filter(
      (sub: any) =>
        (sub.fail_count || 0) < failCountThreshold && sub.is_active !== false
    );

    if (realTimeCheck) {
      // 실시간 검사: 실제 무음 알림 발송으로 검사
      const testPayload = {
        title: "",
        body: "",
        tag: "validity-check-silent",
        silent: true,
        requireInteraction: false,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: {
          isValidityCheck: true,
          timestamp: Date.now(),
        },
        actions: [],
      };

      for (const subscription of remainingSubscriptions) {
        try {
          // 구독 정보가 완전한지 확인
          if (!subscription.p256dh || !subscription.auth) {
            devLog.log(`구독 키 정보 불완전 (ID: ${subscription.id})`);
            cleanedCount++;
            expiredCleaned++;

            if (forceDelete) {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
              forceDeleted++;
            } else {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  is_active: false,
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            }
            continue;
          }

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

          // 410 Gone 에러 또는 기타 만료 관련 오류인 경우 정리
          if (error.statusCode === 410 || error.statusCode === 400) {
            cleanedCount++;
            expiredCleaned++;

            if (forceDelete) {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
              forceDeleted++;
            } else {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  is_active: false,
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            }
            devLog.log(
              `만료된 구독 정리됨 (실시간 검사) (ID: ${subscription.id})`
            );
          }
        }
      }
    } else {
      // 기본 검사: 구독 정보 유효성만 검사 (알림 발송 없음)
      for (const subscription of remainingSubscriptions) {
        try {
          // 구독 정보 유효성 기본 검사
          if (
            !subscription.endpoint ||
            !subscription.p256dh ||
            !subscription.auth
          ) {
            devLog.log(`구독 정보 불완전 (ID: ${subscription.id})`);
            cleanedCount++;
            expiredCleaned++;

            if (forceDelete) {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
              forceDeleted++;
            } else {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  is_active: false,
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            }
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
            expiredCleaned++;

            if (forceDelete) {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
              forceDeleted++;
            } else {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  is_active: false,
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            }
          }
        } catch (error: any) {
          devLog.log(
            `구독 검사 실패 (기본 검사) (ID: ${subscription.id}):`,
            error.message
          );
          cleanedCount++;
          expiredCleaned++;

          if (forceDelete) {
            await prisma.push_subscriptions.delete({
              where: { id: subscription.id },
            });
            forceDeleted++;
          } else {
            await prisma.push_subscriptions.update({
              where: { id: subscription.id },
              data: {
                is_active: false,
                deleted_at: new Date(),
                updated_at: new Date(),
              },
            });
          }
        }
      }
    }

    // 시스템 로그 기록
    if (cleanedCount > 0) {
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP",
        `푸시 구독이 정리되었습니다. 정리된 구독 수: ${cleanedCount} (방식: ${
          realTimeCheck ? "realtime" : "basic"
        }, 강제삭제: ${forceDelete})`,
        "info",
        user.id,
        "system",
        "cleanup",
        {
          user_id: user.id,
          user_email: user.email,
          cleanedCount,
          validCount,
          totalChecked: subscriptions.length,
          checkType: realTimeCheck ? "realtime" : "basic",
          forceDelete,
          failCountThreshold,
          cleanupInactive,
          stats: {
            failCountCleaned,
            inactiveCleaned,
            expiredCleaned,
            forceDeleted,
            oldSoftDeletedCleaned,
          },
          action_type: "push_notification_cleanup",
        },
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
        {
          user_id: user.id,
          user_email: user.email,
          cleanedCount,
          validCount,
          totalChecked: subscriptions.length,
          checkType: realTimeCheck ? "realtime" : "basic",
          forceDelete,
          failCountThreshold,
          cleanupInactive,
          action_type: "push_notification_cleanup",
        },
        user.email,
        clientIP,
        userAgent
      );
    }

    const result: SubscriptionCleanupResult = {
      message:
        cleanedCount > 0
          ? `${cleanedCount}개의 구독이 정리되었습니다.`
          : "모든 구독이 유효합니다.",
      cleanedCount,
      validCount,
      totalChecked: subscriptions.length,
      checkType: realTimeCheck ? "realtime" : "basic",
      forceDelete,
      deleteAfterDays,
      stats: {
        failCountCleaned,
        inactiveCleaned,
        expiredCleaned,
        forceDeleted,
        oldSoftDeletedCleaned,
      },
    };

    return NextResponse.json(result);
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
      {
        success: false,
        error: "SUBSCRIPTION_CLEANUP_ERROR",
        message: "구독 정리 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
