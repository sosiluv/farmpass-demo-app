import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/types/settings";
import { invalidateSystemSettingsCache } from "@/lib/cache/system-settings-cache";
import {
  createSystemLog,
  logApiError,
  logSystemWarning,
} from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createClient } from "@/lib/supabase/server";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// 5분마다 재검증
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      // 설정이 없으면 기본값으로 생성
      const newSettings = await prisma.systemSettings.create({
        data: {
          ...DEFAULT_SYSTEM_SETTINGS,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
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
          action: "INITIALIZE",
          settingsCount: Object.keys(DEFAULT_SYSTEM_SETTINGS).length,
          method: "GET /api/settings",
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
      { error: "Failed to fetch system settings" },
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
    // 인증 체크
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // 설정 수정 권한 없음 로그 (문서에 명시된 WARN 레벨)
      await logSystemWarning(
        "settings_unauthorized_access",
        "인증되지 않은 사용자의 설정 변경 시도",
        {
          ip: clientIP,
          userAgent,
        },
        {
          auth_error: authError?.message,
          endpoint: "PATCH /api/settings",
        }
      );

      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.account_type !== "admin") {
      // 설정 수정 권한 부족 로그 (문서에 명시된 WARN 레벨)
      await logSystemWarning(
        "settings_insufficient_permission",
        "관리자가 아닌 사용자의 설정 변경 시도",
        {
          userId: user.id,
          email: user.email,
          ip: clientIP,
          userAgent,
        },
        {
          account_type: profile?.account_type || "unknown",
          endpoint: "PATCH /api/settings",
        }
      );

      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const data = await request.json();
    const settings = await prisma.systemSettings.findFirst();

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
        { error: "설정을 찾을 수 없습니다." },
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
        !["createdAt", "updatedAt"].includes(key) &&
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
      const updated = await tx.systemSettings.update({
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
          changed_fields: changedFields,
          old_values: changedFields.reduce((acc, field) => {
            acc[field] = settings[field as keyof typeof settings];
            return acc;
          }, {} as Record<string, any>),
          new_values: changedFields.reduce((acc, field) => {
            acc[field] = data[field];
            return acc;
          }, {} as Record<string, any>),
          update_method: "PATCH_API",
        },
        user.email,
        clientIP,
        userAgent
      );
    }

    // 캐시 무효화
    invalidateSystemSettingsCache();

    return NextResponse.json(updatedSettings, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
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
        error: error instanceof Error ? error.message : String(error),
        update_method: "PATCH_API",
      },
      undefined, // userEmail - 에러 상황에서는 user 정보가 없을 수 있음
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { error: "Failed to update system settings" },
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
