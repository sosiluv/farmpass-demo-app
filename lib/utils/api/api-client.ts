/**
 * =================================
 * 📡 통합 API 클라이언트
 * =================================
 * 모든 API 호출을 중앙화하여 중복 코드 제거
 * 에러 처리, 로딩 상태, 캐시 관리 통합
 */

import { logApiError } from "@/lib/utils/logging/system-log";
import { devLog } from "../logging/dev-logger";

// =================================
// 공통 타입 정의
// =================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  timeout?: number;
  retries?: number;
}

interface CacheConfig {
  ttl: number; // Time to live in ms
  key: string;
}

// =================================
// 캐시 관리
// =================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const apiCache = new ApiCache();

// =================================
// 요청 중복 방지
// =================================

const pendingRequests = new Map<string, Promise<any>>();

// =================================
// 통합 API 클라이언트
// =================================

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = "",
    defaultHeaders: Record<string, string> = {},
    defaultTimeout: number = 10000
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...defaultHeaders,
    };
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * 통합 API 요청 메서드
   */
  async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {},
    cacheConfig?: CacheConfig,
    userId?: string
  ): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      cache = false,
      timeout = this.defaultTimeout,
      retries = 3,
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const requestKey = `${method}:${url}:${JSON.stringify(body)}`;

    // 캐시 확인 (GET 요청만)
    if (method === "GET" && cacheConfig && apiCache.has(cacheConfig.key)) {
      const cachedData = apiCache.get<T>(cacheConfig.key);
      if (cachedData) {
        devLog.log(`[API] Cache hit for: ${cacheConfig.key}`);
        return cachedData;
      }
    }

    // 중복 요청 방지
    if (pendingRequests.has(requestKey)) {
      devLog.log(`[API] Duplicate request prevented: ${requestKey}`);
      return pendingRequests.get(requestKey);
    }

    const requestPromise = this.executeRequest<T>(
      url,
      method,
      headers,
      body,
      timeout,
      retries,
      userId
    );

    pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;

      // 캐시 저장 (GET 요청만)
      if (method === "GET" && cacheConfig) {
        apiCache.set(cacheConfig.key, result, cacheConfig.ttl);
        devLog.log(`[API] Cached data for: ${cacheConfig.key}`);
      }

      return result;
    } finally {
      pendingRequests.delete(requestKey);
    }
  }

  /**
   * 실제 HTTP 요청 실행
   */
  private async executeRequest<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeout: number,
    retries: number,
    userId?: string
  ): Promise<T> {
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: "include", // 쿠키 포함하여 요청
      signal: AbortSignal.timeout(timeout),
    };

    if (body && method !== "GET") {
      requestOptions.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        devLog.log(`[API] ${method} ${url} (attempt ${attempt}/${retries})`);

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Rate Limit (429) 특별 처리
          if (response.status === 429) {
            const retryAfter = errorData.retryAfter || 90;
            const error = new Error(
              `요청이 너무 많습니다. ${retryAfter}초 후에 다시 시도해주세요.`
            );

            // API 에러 로그 기록
            await logApiError(url, method, error, userId);

            throw error;
          }

          const error = new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );

          // API 에러 로그 기록
          await logApiError(url, method, error, userId);

          throw error;
        }

        const result = await response.json();
        devLog.success(`[API] Success: ${method} ${url}`);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt === retries) {
          devLog.error(
            `[API] Failed after ${retries} attempts: ${method} ${url}`,
            lastError
          );
          break;
        }

        // 재시도 전 대기 (지수 백오프)
        const delay = Math.pow(2, attempt - 1) * 1000;
        devLog.warn(`[API] Retrying in ${delay}ms: ${method} ${url}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Request failed");
  }

  /**
   * GET 요청 헬퍼
   */
  async get<T>(
    endpoint: string,
    cacheConfig?: CacheConfig,
    userId?: string
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" }, cacheConfig, userId);
  }

  /**
   * POST 요청 헬퍼
   */
  async post<T>(endpoint: string, body?: any, userId?: string): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: "POST", body },
      undefined,
      userId
    );
  }

  /**
   * PUT 요청 헬퍼
   */
  async put<T>(endpoint: string, body?: any, userId?: string): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: "PUT", body },
      undefined,
      userId
    );
  }

  /**
   * DELETE 요청 헬퍼
   */
  async delete<T>(endpoint: string, userId?: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" }, undefined, userId);
  }

  /**
   * 캐시 관리 메서드
   */
  clearCache(pattern?: string): void {
    apiCache.clear(pattern);
  }

  /**
   * 캐시 상태 확인
   */
  isCached(key: string): boolean {
    return apiCache.has(key);
  }
}

// =================================
// 전역 API 클라이언트 인스턴스
// =================================

export const apiClient = new ApiClient();

// =================================
// 공통 캐시 설정
// =================================

export const CACHE_CONFIGS = {
  FARMS: { key: "farms", ttl: 5 * 60 * 1000 }, // 5분
  VISITORS: { key: "visitors", ttl: 2 * 60 * 1000 }, // 2분
  FARM_MEMBERS: { key: "farm_members", ttl: 2 * 60 * 1000 }, // 2분
  SETTINGS: { key: "settings", ttl: 10 * 60 * 1000 }, // 10분
  USER_INFO: { key: "user-info", ttl: 2 * 60 * 1000 }, // 2분
  NOTIFICATIONS: { key: "notifications", ttl: 1 * 60 * 1000 }, // 1분
  STATS: { key: "stats", ttl: 30 * 1000 }, // 30초
} as const;

// =================================
// 공통 에러 처리 유틸리티
// =================================

export interface ErrorHandler {
  (error: Error, context?: string): void;
}

export const createErrorHandler = (
  toast: any,
  fallbackMessage: string = "작업 중 오류가 발생했습니다."
): ErrorHandler => {
  return (error: Error, context?: string) => {
    devLog.error(`[ERROR${context ? ` - ${context}` : ""}]:`, error);

    toast({
      title: "오류 발생",
      description: error.message || fallbackMessage,
      variant: "destructive",
    });
  };
};

// =================================
// 응답 타입 헬퍼
// =================================

export const isApiError = (response: any): response is { error: string } => {
  return response && typeof response.error === "string";
};

export const extractData = <T>(response: ApiResponse<T>): T => {
  if (isApiError(response)) {
    throw new Error(response.error);
  }

  return response.data || (response as T);
};
