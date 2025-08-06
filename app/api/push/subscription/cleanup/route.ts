import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import webpush from "web-push";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import type {
  SubscriptionCleanupOptions,
  SubscriptionCleanupResult,
} from "@/lib/types/notification";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

// 만료된 푸시 구독 정리
export async function POST(request: NextRequest) {
  let user = null;
  let body: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    // 요청 본문에서 검사 타입 확인
    body = (await request
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
        let settings;
        try {
          settings = await getSystemSettings();
        } catch (queryError) {
          throwBusinessError(
            "GENERAL_QUERY_FAILED",
            {
              resourceType: "systemSettings",
            },
            queryError
          );
        }
        publicKey = publicKey || settings?.vapidPublicKey || undefined;
        privateKey = privateKey || settings?.vapidPrivateKey || undefined;
      }
      if (!publicKey || !privateKey) {
        throwBusinessError("VAPID_KEY_REQUIRED_FOR_REALTIME");
      }
      webpush.setVapidDetails("mailto:k331502@nate.com", publicKey, privateKey);
    }

    // 사용자의 모든 구독 조회 (삭제되지 않은 구독만)
    let subscriptions;
    try {
      subscriptions = await prisma.push_subscriptions.findMany({
        where: {
          user_id: user.id,
          deleted_at: null, // 삭제되지 않은 구독만
        },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "pushSubscription",
        },
        queryError
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // 정리할 구독이 없는 경우
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP_NONE",
        LOG_MESSAGES.PUSH_SUBSCRIPTION_CLEANUP_NONE(),
        "info",
        { id: user.id, email: user.email || "" },
        "notification",
        undefined,
        {
          action_type: "push_notification_event",
          event: "push_subscription_cleanup_none",
          user_id: user.id,
          user_email: user.email,
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: "정리할 구독이 없습니다.",
        result: {
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
        } as SubscriptionCleanupResult,
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
            try {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
            } catch (deleteError) {
              throwBusinessError(
                "GENERAL_DELETE_FAILED",
                {
                  resourceType: "pushSubscription",
                },
                deleteError
              );
            }
            forceDeleted++;
          } else {
            // soft delete
            try {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  is_active: false,
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            } catch (updateError) {
              throwBusinessError(
                "GENERAL_UPDATE_FAILED",
                {
                  resourceType: "pushSubscription",
                },
                updateError
              );
            }
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

      let oldSoftDeletedSubscriptions;
      try {
        oldSoftDeletedSubscriptions = await prisma.push_subscriptions.findMany({
          where: {
            user_id: user.id,
            deleted_at: {
              not: null,
              lt: cutoffDate,
            },
          },
        });
      } catch (queryError) {
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "pushSubscription",
            operation: "find_old_soft_deleted_subscriptions",
            userId: user.id,
            cutoffDate: cutoffDate.toISOString(),
          },
          queryError
        );
      }

      for (const subscription of oldSoftDeletedSubscriptions) {
        try {
          // 완전 삭제 (이미 soft delete된 구독이므로)
          try {
            await prisma.push_subscriptions.delete({
              where: { id: subscription.id },
            });
          } catch (deleteError) {
            throwBusinessError(
              "GENERAL_DELETE_FAILED",
              {
                resourceType: "pushSubscription",
              },
              deleteError
            );
          }
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
            try {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
            } catch (deleteError) {
              throwBusinessError(
                "GENERAL_DELETE_FAILED",
                {
                  resourceType: "pushSubscription",
                },
                deleteError
              );
            }
            forceDeleted++;
          } else {
            // soft delete
            try {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            } catch (updateError) {
              throwBusinessError(
                "GENERAL_UPDATE_FAILED",
                {
                  resourceType: "pushSubscription",
                },
                updateError
              );
            }
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
              try {
                await prisma.push_subscriptions.delete({
                  where: { id: subscription.id },
                });
              } catch (deleteError) {
                throwBusinessError(
                  "GENERAL_DELETE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  deleteError
                );
              }
              forceDeleted++;
            } else {
              try {
                await prisma.push_subscriptions.update({
                  where: { id: subscription.id },
                  data: {
                    is_active: false,
                    deleted_at: new Date(),
                    updated_at: new Date(),
                  },
                });
              } catch (updateError) {
                throwBusinessError(
                  "GENERAL_UPDATE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  updateError
                );
              }
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
              try {
                await prisma.push_subscriptions.delete({
                  where: { id: subscription.id },
                });
              } catch (deleteError) {
                throwBusinessError(
                  "GENERAL_DELETE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  deleteError
                );
              }
              forceDeleted++;
            } else {
              try {
                await prisma.push_subscriptions.update({
                  where: { id: subscription.id },
                  data: {
                    is_active: false,
                    deleted_at: new Date(),
                    updated_at: new Date(),
                  },
                });
              } catch (updateError) {
                throwBusinessError(
                  "GENERAL_UPDATE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  updateError
                );
              }
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
              try {
                await prisma.push_subscriptions.delete({
                  where: { id: subscription.id },
                });
              } catch (deleteError) {
                throwBusinessError(
                  "GENERAL_DELETE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  deleteError
                );
              }
              forceDeleted++;
            } else {
              try {
                await prisma.push_subscriptions.update({
                  where: { id: subscription.id },
                  data: {
                    is_active: false,
                    deleted_at: new Date(),
                    updated_at: new Date(),
                  },
                });
              } catch (updateError) {
                throwBusinessError(
                  "GENERAL_UPDATE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  updateError
                );
              }
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
              try {
                await prisma.push_subscriptions.delete({
                  where: { id: subscription.id },
                });
              } catch (deleteError) {
                throwBusinessError(
                  "GENERAL_DELETE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  deleteError
                );
              }
              forceDeleted++;
            } else {
              try {
                await prisma.push_subscriptions.update({
                  where: { id: subscription.id },
                  data: {
                    is_active: false,
                    deleted_at: new Date(),
                    updated_at: new Date(),
                  },
                });
              } catch (updateError) {
                throwBusinessError(
                  "GENERAL_UPDATE_FAILED",
                  {
                    resourceType: "pushSubscription",
                  },
                  updateError
                );
              }
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
            try {
              await prisma.push_subscriptions.delete({
                where: { id: subscription.id },
              });
            } catch (deleteError) {
              throwBusinessError(
                "GENERAL_DELETE_FAILED",
                {
                  resourceType: "pushSubscription",
                },
                deleteError
              );
            }
            forceDeleted++;
          } else {
            try {
              await prisma.push_subscriptions.update({
                where: { id: subscription.id },
                data: {
                  is_active: false,
                  deleted_at: new Date(),
                  updated_at: new Date(),
                },
              });
            } catch (updateError) {
              throwBusinessError(
                "GENERAL_UPDATE_FAILED",
                {
                  resourceType: "pushSubscription",
                },
                updateError
              );
            }
          }
        }
      }
    }

    // 시스템 로그 기록
    if (cleanedCount > 0) {
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP",
        LOG_MESSAGES.PUSH_SUBSCRIPTION_CLEANUP({
          cleanedCount,
          validCount,
          totalChecked: subscriptions.length,
          realTimeCheck,
          forceDelete,
          failCountThreshold,
          cleanupInactive,
          deleteAfterDays,
        }),
        "info",
        { id: user.id, email: user.email || "" },
        "notification",
        undefined,
        {
          action_type: "push_notification_event",
          event: "push_subscription_cleanup",
          user_id: user.id,
          user_email: user.email,
          cleanedCount,
          validCount,
          totalChecked: subscriptions.length,
          realTimeCheck,
          forceDelete,
          failCountThreshold,
          cleanupInactive,
          deleteAfterDays,
        },
        request
      );
    } else {
      // 모든 구독이 유효한 경우도 로그
      await createSystemLog(
        "PUSH_SUBSCRIPTION_CLEANUP_ALL_VALID",
        LOG_MESSAGES.PUSH_SUBSCRIPTION_CLEANUP_ALL_VALID({
          totalChecked: subscriptions.length,
          validCount,
          realTimeCheck,
        }),
        "info",
        { id: user.id, email: user.email || "" },
        "notification",
        undefined,
        {
          action_type: "push_notification_event",
          event: "push_subscription_cleanup_all_valid",
          user_id: user.id,
          user_email: user.email,
          totalChecked: subscriptions.length,
          validCount,
          realTimeCheck,
        },
        request
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
    // 푸시 구독 정리 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "PUSH_SUBSCRIPTION_CLEANUP_FAILED",
      LOG_MESSAGES.PUSH_SUBSCRIPTION_CLEANUP_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      undefined,
      {
        action_type: "push_notification_event",
        event: "push_subscription_cleanup_failed",
        error_message: errorMessage,
        user_id: user?.id,
        user_email: user?.email,
        real_time_check: body?.realTimeCheck,
        force_delete: body?.forceDelete,
        fail_count_threshold: body?.failCountThreshold,
        cleanup_inactive: body?.cleanupInactive,
        delete_after_days: body?.deleteAfterDays,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "cleanup_push_subscriptions",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
