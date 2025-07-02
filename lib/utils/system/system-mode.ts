import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { createClient } from "@/lib/supabase/server";
import { createErrorLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
/**
 * 현재 유지보수 모드 상태 확인
 * @param bypassCache 캐시를 우회하고 DB에서 직접 조회할지 여부 (기본값: false)
 */
export async function isMaintenanceMode(bypassCache = false): Promise<boolean> {
  try {
    if (bypassCache) {
      const supabase = await createClient();

      const { data: settings } = await supabase
        .from("system_settings")
        .select("maintenanceMode")
        .single();

      return Boolean(settings?.maintenanceMode);
    }

    const settings = await getSystemSettings();
    return Boolean(settings.maintenanceMode);
  } catch (error) {
    devLog.error("[SYSTEM-MODE] Failed to check maintenance mode:", error);
    devLog.error("[SYSTEM-MODE] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });

    // 유지보수 모드 체크 실패 로그 (문서에 명시된 ERROR 레벨)
    await createErrorLog("MAINTENANCE_MODE_CHECK_FAILED", error, "system-mode");

    // 에러 시에는 false를 반환하여 정상 동작하도록 함
    return false;
  }
}

/**
 * 현재 디버그 모드 상태 확인
 */
export async function isDebugMode(): Promise<boolean> {
  try {
    const settings = await getSystemSettings();
    return Boolean(settings.debugMode);
  } catch (error) {
    devLog.error("[SYSTEM-MODE] Failed to check debug mode:", error);

    // 디버그 모드 체크 실패 로그 (문서에 명시된 ERROR 레벨)
    await createErrorLog("DEBUG_MODE_CHECK_FAILED", error, "system-mode");

    return false;
  }
}

/**
 * 사용자가 관리자인지 확인
 */
export async function isAdminUser(userId?: string): Promise<boolean> {
  if (!userId) {
    devLog.log(`[SYSTEM-MODE] No userId provided, not admin`);
    return false;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .single();

    const isAdmin = profile?.account_type === "admin";
    devLog.log(
      `[SYSTEM-MODE] User ${userId} admin check: ${isAdmin} (account_type: ${profile?.account_type})`
    );

    return isAdmin;
  } catch (error) {
    devLog.error("[SYSTEM-MODE] Failed to check admin status:", error);

    // 관리자 상태 체크 실패 로그 (문서에 명시된 ERROR 레벨)
    await createErrorLog("ADMIN_STATUS_CHECK_FAILED", error, "system-mode");

    return false;
  }
}

/**
 * 디버그 로그 출력 (디버그 모드일 때만)
 */
export async function debugLog(message: string, data?: any) {
  const debugMode = await isDebugMode();
  if (debugMode) {
    devLog.log(`[DEBUG] ${message}`, data || "");
  }
}

/**
 * 시스템 모드 정보 조회
 */
export async function getSystemModeInfo() {
  try {
    const settings = await getSystemSettings();
    return {
      maintenanceMode: Boolean(settings.maintenanceMode),
      debugMode: Boolean(settings.debugMode),
    };
  } catch (error) {
    devLog.error("[SYSTEM-MODE] Failed to get system mode info:", error);

    // 시스템 모드 정보 조회 실패 로그 (문서에 명시된 ERROR 레벨)
    await createErrorLog("SYSTEM_MODE_INFO_FAILED", error, "system-mode");

    return {
      maintenanceMode: false,
      debugMode: false,
    };
  }
}
