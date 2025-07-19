import { SystemSettings } from "@/lib/types/settings";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/constants/defaults";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data";
import crypto from "crypto";

export class SystemSettingsCache {
  private cache: SystemSettings | null = null;
  private cacheTime: number = 0;
  private loading: Promise<SystemSettings> | null = null;
  private lastInvalidation: number = 0;
  private static instance: SystemSettingsCache;
  private static CACHE_TTL = 300000; // 5분

  constructor() {
    if (SystemSettingsCache.instance) {
      return SystemSettingsCache.instance;
    }
    SystemSettingsCache.instance = this;
  }

  private isCacheStale(): boolean {
    return Date.now() - this.cacheTime > SystemSettingsCache.CACHE_TTL;
  }

  private getCachedSettings(): SystemSettings | null {
    if (!this.cache) return null;
    return this.cache;
  }

  private setCachedSettings(settings: SystemSettings): void {
    this.cache = settings;
    this.cacheTime = Date.now();
  }

  /**
   * API를 통해 설정 조회
   */
  private async fetchFromAPI(): Promise<SystemSettings> {
    try {
      if (process.env.NODE_ENV === "development") {
        devLog.log("[CACHE] Fetching settings from API");
      }

      // 서버 사이드에서는 직접 데이터베이스 조회
      if (typeof window === "undefined") {
        const { prisma } = await import("@/lib/prisma");
        const settings = await prisma.systemSettings.findFirst();

        if (settings) {
          if (process.env.NODE_ENV === "development") {
            devLog.log("[CACHE] Settings fetched from database directly");
          }
          return settings as SystemSettings;
        } else {
          // 설정이 없으면 기본값으로 생성
          const newSettings = await prisma.systemSettings.create({
            data: {
              ...DEFAULT_SYSTEM_SETTINGS,
              id: crypto.randomUUID(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
          return newSettings as SystemSettings;
        }
      } else {
        // 클라이언트 사이드에서는 API 호출
        const baseUrl = window.location.origin;
        const settings = await apiClient(`${baseUrl}/api/settings`, {
          context: "시스템 설정 조회",
        });

        // ✅ 캐시 데이터 새로고침 성공 로그 (개발 환경에서만)
        if (process.env.NODE_ENV === "development") {
          devLog.log("[CACHE] Settings refreshed successfully");
        }

        return settings as SystemSettings;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        devLog.error("시스템 설정 조회 실패:", error);
        devLog.error("Failed to refresh settings cache, using defaults");
      }

      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        id: "temp-default",
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }

  /**
   * 설정 조회 (캐시 우선, 백그라운드 리프레시)
   */
  async getSettings(): Promise<SystemSettings> {
    // 1. 캐시에서 먼저 확인
    const cached = this.getCachedSettings();
    const isStale = !cached || this.isCacheStale();

    // 최근 무효화 확인
    const now = Date.now();
    const timeSinceInvalidation = now - this.lastInvalidation;
    const forceRefresh = timeSinceInvalidation < 30000; // 30초 이내

    // 캐시가 유효하고 강제 새로고침이 필요없는 경우 - 캐시 히트
    if (cached && !isStale && !forceRefresh) {
      // ✅ 캐시 히트 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === "development") {
        devLog.log("[CACHE] Settings cache hit");
      }
      return cached;
    }

    // 캐시 미스 또는 만료 - 새 데이터 필요
    if (!cached || isStale) {
      // ⚠️ 캐시 미스 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === "development") {
        devLog.warn(
          `[CACHE] Settings cache miss: ${
            !cached ? "no cache" : "cache expired"
          }`
        );
      }
    }

    // 2. 이미 진행 중인 요청이 있다면 해당 Promise 반환
    if (this.loading) {
      return this.loading;
    }

    // 3. 새로운 요청 시작
    this.loading = this.fetchFromAPI().then((settings) => {
      this.setCachedSettings(settings);
      return settings;
    });

    try {
      // 캐시가 있다면 캐시 반환 후 백그라운드에서 업데이트
      if (cached) {
        this.loading.then(async () => {
          if (process.env.NODE_ENV === "development") {
            devLog.log("[CACHE] Background refresh completed");
          }
          // 백그라운드 업데이트 완료
        });
        return cached;
      }

      // 캐시가 없다면 새로운 데이터 대기
      const settings = await this.loading;
      return settings;
    } finally {
      this.loading = null;
    }
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(): void {
    if (process.env.NODE_ENV === "development") {
      devLog.log("[CACHE] Cache invalidated");
    }
    this.lastInvalidation = Date.now();
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * 캐시 정보 조회
   */
  getCacheInfo() {
    return {
      hasCachedData: !!this.cache,
      cacheAge: this.cache ? Date.now() - this.cacheTime : 0,
      isStale: this.isCacheStale(),
      lastInvalidation: this.lastInvalidation,
    };
  }
}

// 싱글톤 인스턴스
const systemSettingsCache = new SystemSettingsCache();

// 편의 함수들
export const getSystemSettings = () => systemSettingsCache.getSettings();

// 특정 설정값 조회 함수
export const getSystemSetting = async <K extends keyof SystemSettings>(
  key: K
): Promise<SystemSettings[K]> => {
  const settings = await getSystemSettings();
  return settings[key];
};

// 캐시 무효화 함수
export const invalidateSystemSettingsCache = () => {
  systemSettingsCache.invalidateCache();
};

// 모든 캐시 초기화
export const clearAllSystemSettingsCache = () => {
  systemSettingsCache.invalidateCache();
};
