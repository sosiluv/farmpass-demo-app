import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { logApiError } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";

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
    // 사용자 인증 확인
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const body = await request.json();
    const { subscription, deviceId, options } = body;
    // 더 이상 사용하지 않음 - 항상 전체 구독으로 통합

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: "INCOMPLETE_SUBSCRIPTION",
          message: "구독 정보가 불완전합니다.",
        },
        { status: 400 }
      );
    }

    // 구독 데이터 무결성 검증
    const validation = validateSubscriptionData(subscription);
    if (!validation.valid) {
      devLog.error("구독 데이터 검증 실패:", validation.errors);
      return NextResponse.json(
        {
          success: false,
          error: "SUBSCRIPTION_VALIDATION_FAILED",
          message: validation.errors,
        },
        { status: 400 }
      );
    }

    // 기존 구독 확인 및 등록/갱신을 upsert로 통합
    const newSubscription = await prisma.push_subscriptions.upsert({
      where: {
        // user_id와 endpoint의 복합 unique 인덱스가 필요합니다.
        user_id_endpoint: {
          user_id: user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        is_active: true,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        device_id: deviceId || null,
        user_agent: userAgent || null,
        last_used_at: new Date(),
        fail_count: 0,
        deleted_at: null,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        device_id: deviceId || null,
        user_agent: userAgent || null,
        is_active: true,
        fail_count: 0,
        last_used_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 알림 설정 업데이트 (options.updateSettings가 true인 경우에만)
    if (options?.updateSettings !== false) {
      const existingSettings =
        await prisma.user_notification_settings.findUnique({
          where: { user_id: user.id },
        });
      if (!existingSettings) {
        try {
          await prisma.user_notification_settings.create({
            data: {
              user_id: user.id,
              notification_method: "push",
              visitor_alerts: true,
              notice_alerts: true,
              emergency_alerts: true,
              maintenance_alerts: true,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        } catch (settingsError: any) {
          devLog.warn("알림 설정 자동 생성 실패:", settingsError);
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
      } else if (options?.isResubscribe) {
        try {
          await prisma.user_notification_settings.update({
            where: { user_id: user.id },
            data: { is_active: true, updated_at: new Date() },
          });
        } catch (settingsError: any) {
          devLog.warn("알림 설정 업데이트 실패:", settingsError);
        }
      }
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
        success: true,
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
      {
        success: false,
        error: "SUBSCRIPTION_SERVER_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// 푸시 구독 조회
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    let whereCondition: any = {
      user_id: user.id,
      is_active: true, // 활성 구독만 조회
    };

    const subscriptions = await prisma.push_subscriptions.findMany({
      where: whereCondition,
    });

    // 구독 유효성 검사 (만료된 구독 감지)
    let expiredCount = 0;
    const validSubscriptions = [];

    if (subscriptions && subscriptions.length > 0) {
      // VAPID 키 설정 확인
      // 환경변수 우선, 없으면 시스템 설정에서 조회
      const envPublicKey = process.env.VAPID_PUBLIC_KEY;
      const envPrivateKey = process.env.VAPID_PRIVATE_KEY;
      let publicKey: string | undefined = envPublicKey;
      let privateKey: string | undefined = envPrivateKey;
      if (!publicKey || !privateKey) {
        const settings = await prisma.system_settings.findFirst({
          select: {
            vapidPublicKey: true,
            vapidPrivateKey: true,
          },
        });
        publicKey = publicKey || settings?.vapidPublicKey || undefined;
        privateKey = privateKey || settings?.vapidPrivateKey || undefined;
      }
      if (publicKey && privateKey) {
        const webpush = require("web-push");
        webpush.setVapidDetails(
          "mailto:k331502@nate.com",
          publicKey,
          privateKey
        );

        // 각 구독의 유효성 검사
        for (const subscription of subscriptions) {
          try {
            // 실제로는 발송하지 않고 구독 객체만 검증
            if (
              subscription.endpoint &&
              subscription.p256dh &&
              subscription.auth
            ) {
              validSubscriptions.push(subscription);
            } else {
              devLog.warn("구독 정보 불완전:", subscription);
              continue; // 이 구독은 건너뛰고 다음 구독으로
            }
          } catch (error: any) {
            devLog.log(
              `구독 유효성 검사 실패 (ID: ${subscription.id}):`,
              error.message
            );

            // 만료된 구독으로 간주하고 삭제
            expiredCount++;
            await prisma.push_subscriptions.delete({
              where: {
                id: subscription.id,
              },
            });

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
      {
        success: false,
        error: "SUBSCRIPTION_GET_SYSTEM_ERROR",
        message: "구독 조회 중 시스템 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

// 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const body = await request.json();
    const { endpoint, forceDelete, options } = body;

    if (!endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_ENDPOINT",
          message: "구독 엔드포인트가 필요합니다.",
        },
        { status: 400 }
      );
    }

    // forceDelete가 true인 경우 (특수한 경우에만 사용) 인증 없이 endpoint로만 삭제
    if (forceDelete) {
      devLog.log(`강제 구독 해제: endpoint ${endpoint}의 모든 구독 삭제`);

      try {
        // 강제 삭제 시에는 실제 삭제 (soft delete 아님)
        const deletedSubscriptions = await prisma.push_subscriptions.deleteMany(
          {
            where: {
              endpoint: endpoint,
            },
          }
        );

        devLog.log(
          `강제 삭제 완료: ${deletedSubscriptions.count}개 구독 삭제됨`
        );

        await createSystemLog(
          "PUSH_SUBSCRIPTION_FORCE_DELETE",
          `강제 구독 해제: ${endpoint}`,
          "info",
          undefined,
          "notification",
          undefined,
          {
            endpoint,
            deletedCount: deletedSubscriptions.count,
            reason: "force_delete",
            userAgent,
          },
          undefined,
          clientIP,
          userAgent
        );

        return NextResponse.json({
          success: true,
          message: "구독이 강제로 해제되었습니다.",
          deletedCount: deletedSubscriptions.count,
        });
      } catch (error) {
        devLog.error("강제 구독 해제 실패:", error);

        await logApiError(
          "/api/push/subscription",
          "DELETE",
          error instanceof Error ? error : new Error(String(error)),
          undefined,
          { ip: clientIP, userAgent }
        );

        return NextResponse.json(
          {
            success: false,
            error: "DATABASE_ERROR",
            message: "구독 해제 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }
    }

    // 일반적인 경우 - 인증 필요
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    // 구독 정보 조회 (soft delete 전에 정보 확인)
    const existingSubscriptions = await prisma.push_subscriptions.findMany({
      where: {
        user_id: user.id,
        endpoint: endpoint,
        is_active: true, // 활성 구독만
      },
    });

    if (existingSubscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "SUBSCRIPTION_NOT_FOUND",
          message: "해당 구독을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 구독 soft delete (전체 구독 해제)
    devLog.log(
      `구독 해제: endpoint ${endpoint}의 ${existingSubscriptions.length}개 구독 soft delete`
    );

    const updateResult = await prisma.push_subscriptions.updateMany({
      where: {
        user_id: user.id,
        endpoint: endpoint,
        is_active: true, // 활성 구독만
      },
      data: {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date(),
        // fail_count는 0으로 초기화 (수동 해제이므로)
        fail_count: 0,
        last_fail_at: null,
      },
    });

    // 알림 설정 업데이트 (options.updateSettings가 true인 경우에만)
    if (options?.updateSettings !== false) {
      try {
        // 구독 해제 시 알림 설정 비활성화
        await prisma.user_notification_settings.update({
          where: { user_id: user.id },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        });
        devLog.log(`사용자 ${user.id}의 알림 설정 비활성화 완료`);
      } catch (settingsError: any) {
        devLog.warn("알림 설정 업데이트 실패:", settingsError);

        // 알림 설정 업데이트 실패 시 시스템 로그 기록
        await createSystemLog(
          "NOTIFICATION_SETTINGS_UPDATE_FAILED",
          `구독 해제 시 알림 설정 업데이트에 실패했습니다.`,
          "warn",
          user.id,
          "system",
          endpoint,
          {
            error: settingsError.message,
            endpoint,
            user_id: user.id,
          },
          user.email,
          clientIP,
          userAgent
        );
      }
    }

    // 시스템 로그 기록 (상세 정보 포함)
    await createSystemLog(
      "PUSH_SUBSCRIPTION_DELETED",
      `사용자가 푸시 알림 구독을 해제했습니다. (엔드포인트: ${endpoint})`,
      "info",
      user.id,
      "system",
      endpoint,
      {
        endpoint,
        deletedCount: updateResult.count,
        deviceIds: existingSubscriptions
          .map((sub: any) => sub.device_id)
          .filter(Boolean),
        userAgent,
        updateSettings: options?.updateSettings !== false,
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: true,
        message: "푸시 알림 구독이 해제되었습니다.",
        deletedCount: updateResult.count,
        endpoint,
      },
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
      {
        success: false,
        error: "SUBSCRIPTION_SERVER_ERROR",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
