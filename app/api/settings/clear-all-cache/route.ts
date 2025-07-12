import { NextRequest, NextResponse } from "next/server";
import {
  clearAllSystemSettingsCache,
  getSystemSettings,
} from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    // 1. 서버 측 캐시 완전 초기화
    clearAllSystemSettingsCache();
    devLog.log("[CLEAR-CACHE] Server cache cleared");

    // 2. 현재 설정 강제 로드
    const freshSettings = await getSystemSettings();
    devLog.log("[CLEAR-CACHE] Fresh settings loaded:", {
      maintenanceMode: freshSettings.maintenanceMode,
      debugMode: freshSettings.debugMode,
    });

    return NextResponse.json(
      {
        success: true,
        message: "All caches cleared successfully",
        settings: {
          maintenanceMode: freshSettings.maintenanceMode,
          debugMode: freshSettings.debugMode,
        },
      },
      {
        headers: {
          // 브라우저 캐시 방지
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
          // 강제 새로고침 헤더
          "X-Cache-Clear": "true",
          "X-Maintenance-Mode": String(freshSettings.maintenanceMode),
        },
      }
    );
  } catch (error) {
    devLog.error("[CLEAR-CACHE] Failed to clear all caches:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/settings/clear-all-cache",
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
        error: "CACHE_CLEAR_ALL_FAILED",
        message: "모든 캐시 초기화에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
