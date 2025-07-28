import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/constants/defaults";
import { invalidateSystemSettingsCache } from "@/lib/cache/system-settings-cache";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

// 5분마다 재검증
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const settings = await prisma.system_settings.findFirst();

    if (!settings) {
      // 설정이 없으면 기본값으로 생성
      const newSettings = await prisma.system_settings.create({
        data: {
          ...DEFAULT_SYSTEM_SETTINGS,
          id: crypto.randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // 초기화 이벤트 로깅 - 통합 로깅 시스템 사용
      await createSystemLog(
        "SETTINGS_INITIALIZE",
        "시스템 설정이 초기화되었습니다",
        "info",
        undefined,
        "system",
        undefined,
        {
          settingsCount: Object.keys(DEFAULT_SYSTEM_SETTINGS).length,
          method: "GET /api/settings",
          action_type: "system_settings",
        },
        undefined, // userEmail
        clientIP, // userIP
        userAgent // userAgent
      );

      return NextResponse.json(newSettings, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(settings, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    devLog.error("Error fetching system settings:", error);

    // 설정 조회 API 에러 로그
    await logApiError(
      "/api/settings",
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
        error: "SYSTEM_SETTINGS_FETCH_FAILED",
        message: "시스템 설정 조회에 실패했습니다.",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;

    const data = await request.json();
    const settings = await prisma.system_settings.findFirst();

    if (!settings) {
      // 설정 PATCH 에러 (설정 없음) 로그
      await logApiError(
        "/api/settings",
        "PATCH",
        "Settings not found",
        undefined,
        {
          ip: clientIP,
          userAgent,
        }
      );

      return NextResponse.json(
        {
          error: "SYSTEM_SETTINGS_NOT_FOUND",
          success: false,
          message: "시스템 설정을 찾을 수 없습니다.",
        },
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 변경된 필드 추적 (날짜 필드 제외)
    const changedFields = Object.keys(data).filter(
      (key) =>
        !["created_at", "updated_at"].includes(key) &&
        settings[key as keyof typeof settings] !== data[key]
    );

    Object.keys(data).forEach((key) => {
      devLog.log(`${key}:`, {
        current: settings[key as keyof typeof settings],
        new: data[key],
        isDifferent: settings[key as keyof typeof settings] !== data[key],
      });
    });

    const updatedSettings = await prisma.$transaction(async (tx: any) => {
      // 설정 업데이트
      const updated = await tx.system_settings.update({
        where: { id: settings.id },
        data,
      });

      return updated;
    });

    // 실제 변경된 필드가 있을 때만 로그 생성
    if (changedFields.length > 0) {
      // 전체 설정 변경 요약 로그
      await createSystemLog(
        "SETTINGS_BULK_UPDATE",
        `시스템 설정 일괄 업데이트: ${
          changedFields.length
        }개 필드 변경 (${changedFields.join(", ")})`,
        "info",
        user.id,
        "system",
        undefined,
        {
          updated_fields: Object.keys(data),
          changed_fields: changedFields,
          action_type: "system_settings",
        },
        user.email,
        clientIP,
        userAgent
      );
    }

    // 캐시 무효화
    invalidateSystemSettingsCache();

    // 성공 메시지 생성
    const message =
      changedFields.length > 0
        ? `${changedFields.length}개의 설정이 성공적으로 업데이트되었습니다.`
        : "설정이 성공적으로 저장되었습니다.";

    return NextResponse.json(
      {
        ...updatedSettings,
        success: true,
        message,
        changedFields: changedFields.length > 0 ? changedFields : undefined,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // 설정 PATCH 에러 (일반) 로그
    await logApiError(
      "/api/settings",
      "PATCH",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    // 에러 로그 생성
    await createSystemLog(
      "SETTINGS_UPDATE_ERROR",
      "시스템 설정 업데이트 실패",
      "error",
      undefined,
      "system",
      undefined,
      {
        error_message: error instanceof Error ? error.message : String(error),
        action_type: "system_settings",
      },
      undefined, // userEmail - 에러 상황에서는 user 정보가 없을 수 있음
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        success: false,
        error: "SYSTEM_SETTINGS_UPDATE_FAILED",
        message: "시스템 설정 업데이트에 실패했습니다.",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
