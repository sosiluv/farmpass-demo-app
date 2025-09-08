import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";

/**
 * 🚀 성능 최적화 캐시 관리
 *
 * 유지보수 모드와 관리자 권한 체크 결과를 캐싱하여 DB 조회를 최소화합니다.
 */
const SystemCache = {
  // 유지보수 모드 캐시
  maintenanceModeCache: null as { value: boolean; timestamp: number } | null,

  // 관리자 권한 캐시 (Map으로 사용자별 캐시)
  adminUserCache: new Map<string, { value: boolean; timestamp: number }>(),

  // 캐시 유효 시간 (5분)
  CACHE_DURATION: 5 * 60 * 1000,

  // 캐시 최대 크기 (메모리 누수 방지)
  MAX_CACHE_SIZE: 1000,

  /**
   * 유지보수 모드 상태를 캐시와 함께 조회
   */
  async getMaintenanceMode(): Promise<boolean> {
    // 캐시가 유효한 경우 캐시 값 반환
    if (
      this.maintenanceModeCache &&
      Date.now() - this.maintenanceModeCache.timestamp < this.CACHE_DURATION
    ) {
      return this.maintenanceModeCache.value;
    }

    // 캐시가 없거나 만료된 경우 DB에서 조회
    const mode = await SystemCache.fetchMaintenanceModeFromDB();

    // 캐시 업데이트
    this.maintenanceModeCache = { value: mode, timestamp: Date.now() };

    return mode;
  },

  /**
   * 사용자의 관리자 권한을 캐시와 함께 조회
   */
  async getAdminStatus(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    // 캐시가 유효한 경우 캐시 값 반환
    const cached = this.adminUserCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.value;
    }

    // 캐시가 없거나 만료된 경우 DB에서 조회
    const isAdmin = await SystemCache.fetchAdminStatusFromDB(userId);

    // 캐시 업데이트 (메모리 누수 방지)
    this.cleanupAdminCache();
    this.adminUserCache.set(userId, { value: isAdmin, timestamp: Date.now() });

    return isAdmin;
  },

  /**
   * DB에서 유지보수 모드 상태 조회 (system-settings-cache 활용)
   */
  async fetchMaintenanceModeFromDB(): Promise<boolean> {
    try {
      // system-settings-cache를 활용하여 중복 DB 조회 방지
      const settings = await getSystemSettings();
      return Boolean(settings.maintenanceMode);
    } catch (error) {
      devLog.error(
        "[SYSTEM-MODE] Failed to fetch maintenance mode from cache:",
        error
      );
      return false;
    }
  },

  /**
   * DB에서 관리자 권한 조회
   */
  async fetchAdminStatusFromDB(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        devLog.error("[SYSTEM-MODE] Failed to get user from auth:", userError);
        return false;
      }

      // JWT 토큰의 app_metadata에서 isAdmin 확인
      const isAdmin = user.app_metadata?.isAdmin === true;
      return isAdmin;
    } catch (error) {
      const errorCode = mapRawErrorToCode(error);
      const message = getErrorMessage(errorCode);
      devLog.error(
        "[SYSTEM-MODE] Failed to fetch admin status from DB:",
        message
      );
      return false;
    }
  },

  /**
   * 관리자 캐시 정리 (메모리 누수 방지)
   */
  cleanupAdminCache(): void {
    if (this.adminUserCache.size <= this.MAX_CACHE_SIZE) return;

    const now = Date.now();
    const expiredEntries: string[] = [];

    // 만료된 항목 찾기
    this.adminUserCache.forEach((cache, userId) => {
      if (now - cache.timestamp > this.CACHE_DURATION) {
        expiredEntries.push(userId);
      }
    });

    // 만료된 항목 삭제
    expiredEntries.forEach((userId) => {
      this.adminUserCache.delete(userId);
    });

    // 여전히 크기가 초과하면 가장 오래된 항목부터 삭제
    if (this.adminUserCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.adminUserCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const deleteCount = this.adminUserCache.size - this.MAX_CACHE_SIZE + 100; // 여유분 확보
      for (let i = 0; i < deleteCount && i < entries.length; i++) {
        this.adminUserCache.delete(entries[i][0]);
      }
    }
  },
};

/**
 * 현재 유지보수 모드 상태 확인
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return await SystemCache.getMaintenanceMode();
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

    // 에러 시에는 false를 반환하여 정상 동작하도록 함
    return false;
  }
}

/**
 * 사용자가 관리자인지 확인
 * @param userId 사용자 ID
 */
export async function isAdminUser(userId?: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  return await SystemCache.getAdminStatus(userId);
}
