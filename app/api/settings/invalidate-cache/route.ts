import { NextRequest, NextResponse } from "next/server";
import {
  invalidateSystemSettingsCache,
  clearAllSystemSettingsCache,
  SystemSettingsCache,
} from "@/lib/cache/system-settings-cache";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// 캐시 상태 조회를 위한 인스턴스 생성
const cacheInstance = new SystemSettingsCache();

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    if (force) {
      // 강력한 캐시 초기화
      clearAllSystemSettingsCache();
      devLog.log("[CACHE] All system settings cache cleared (force mode)");
    } else {
      // 일반 캐시 무효화
      invalidateSystemSettingsCache();
      devLog.log("[CACHE] System settings cache invalidated");
    }

    // 캐시 상태 정보
    const cacheInfo = cacheInstance.getCacheInfo();
    devLog.log("[CACHE] Cache status after invalidation:", cacheInfo);

    return NextResponse.json({
      success: true,
      message: force
        ? "Cache cleared completely"
        : "Cache invalidated successfully",
      cacheInfo,
    });
  } catch (error) {
    devLog.error("Failed to invalidate cache:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/settings/invalidate-cache",
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
        error: "CACHE_INVALIDATE_FAILED",
        message: "캐시 무효화에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    // 캐시 상태 조회
    const cacheInfo = cacheInstance.getCacheInfo();

    return NextResponse.json({
      success: true,
      cacheInfo,
    });
  } catch (error) {
    devLog.error("Failed to get cache info:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/settings/invalidate-cache",
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
        error: "CACHE_INFO_FETCH_FAILED",
        message: "캐시 정보 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
