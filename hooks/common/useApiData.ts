/**
 * =================================
 * 🔄 공통 데이터 Fetching 훅
 * =================================
 * 중복된 데이터 fetching 로직을 통합
 * 로딩 상태, 에러 처리, 캐시 관리 자동화
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  apiClient,
  CACHE_CONFIGS,
  createErrorHandler,
} from "@/lib/utils/api/api-client";

// =================================
// 공통 훅 타입 정의
// =================================

export interface UseApiOptions<T> {
  immediate?: boolean; // 즉시 실행 여부
  cache?: boolean; // 캐시 사용 여부
  cacheTtl?: number; // 캐시 TTL (ms)
  cacheKey?: string; // 커스텀 캐시 키
  onSuccess?: (data: T) => void; // 성공 콜백
  onError?: (error: Error) => void; // 에러 콜백
  errorMessage?: string; // 커스텀 에러 메시지
  userId?: string; // 사용자 ID (로깅용)
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  reset: () => void;
}

// =================================
// 기본 API 훅
// =================================

/**
 * 범용 API 요청 훅
 */
export function useApi<T>(
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    immediate = true,
    cache = false,
    cacheTtl = 5 * 60 * 1000, // 기본 5분
    cacheKey,
    onSuccess,
    onError,
    errorMessage = "데이터를 불러오는 중 오류가 발생했습니다.",
    userId,
  } = options;

  const toast = useCommonToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const executeRef = useRef<() => Promise<T | null>>();
  const handleError = createErrorHandler(toast, errorMessage);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const cacheConfig = cache
        ? {
            key: cacheKey || `api:${endpoint}`,
            ttl: cacheTtl,
          }
        : undefined;

      const response = await apiClient.get<T>(endpoint, cacheConfig, userId);
      const result = response as T; // API 클라이언트가 이미 추출된 데이터를 반환

      setData(result);
      onSuccess?.(result);

      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error");
      setError(errorObj);
      onError?.(errorObj);
      handleError(errorObj, `API ${endpoint}`);

      return null;
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    cache,
    cacheKey,
    cacheTtl,
    userId,
    onSuccess,
    onError,
    handleError,
  ]);

  const refresh = useCallback(async (): Promise<T | null> => {
    // 캐시 무효화 후 재실행
    if (cache && cacheKey) {
      apiClient.clearCache(cacheKey);
    }
    return execute();
  }, [execute, cache, cacheKey]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // 참조 저장 (의존성 순환 방지)
  executeRef.current = execute;

  useEffect(() => {
    if (immediate && executeRef.current) {
      executeRef.current();
    }
  }, [immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    reset,
  };
}

// =================================
// 특화된 데이터 Fetching 훅들
// =================================

/**
 * 농장 목록 조회 훅
 */
export function useFarmsData(
  userId?: string,
  options: Omit<UseApiOptions<any>, "userId"> = {}
) {
  return useApi("/api/farms", {
    immediate: !!userId,
    cache: true,
    cacheKey: `farms:${userId}`,
    cacheTtl: CACHE_CONFIGS.FARMS.ttl,
    errorMessage: "농장 목록을 불러오는 중 오류가 발생했습니다.",
    userId,
    ...options,
  });
}

/**
 * 사용자 정보 조회 훅
 */
export function useUserInfo(options: UseApiOptions<any> = {}) {
  return useApi("/api/user-info", {
    immediate: true,
    cache: true,
    cacheKey: CACHE_CONFIGS.USER_INFO.key,
    cacheTtl: CACHE_CONFIGS.USER_INFO.ttl,
    errorMessage: "사용자 정보를 불러오는 중 오류가 발생했습니다.",
    ...options,
  });
}

/**
 * 알림 목록 조회 훅
 */
export function useNotifications(options: UseApiOptions<any> = {}) {
  return useApi("/api/notifications", {
    immediate: true,
    cache: true,
    cacheKey: CACHE_CONFIGS.NOTIFICATIONS.key,
    cacheTtl: CACHE_CONFIGS.NOTIFICATIONS.ttl,
    errorMessage: "알림을 불러오는 중 오류가 발생했습니다.",
    ...options,
  });
}

/**
 * 농장 구성원 조회 훅
 */
export function useFarmMembers(
  farmId: string,
  options: UseApiOptions<any> = {}
) {
  return useApi(`/api/farms/${farmId}/members`, {
    immediate: !!farmId,
    cache: true,
    cacheKey: `members:${farmId}`,
    cacheTtl: 2 * 60 * 1000, // 2분
    errorMessage: "구성원 목록을 불러오는 중 오류가 발생했습니다.",
    ...options,
  });
}

/**
 * 방문자 목록 조회 훅
 */
export function useVisitorsData(
  farmId?: string,
  options: UseApiOptions<any> = {}
) {
  const endpoint = farmId ? `/api/farms/${farmId}/visitors` : "/api/visitors";

  return useApi(endpoint, {
    immediate: true,
    cache: false, // 방문자 데이터는 실시간성이 중요
    errorMessage: "방문자 목록을 불러오는 중 오류가 발생했습니다.",
    ...options,
  });
}

// =================================
// 뮤테이션 훅 (POST, PUT, DELETE)
// =================================

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  errorMessage?: string;
  successMessage?: string;
  invalidateCache?: string | string[]; // 무효화할 캐시 키
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * 뮤테이션 훅 (생성, 수정, 삭제용)
 */
export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const {
    onSuccess,
    onError,
    errorMessage = "작업 중 오류가 발생했습니다.",
    successMessage,
    invalidateCache,
  } = options;

  const toast = useCommonToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const handleError = createErrorHandler(toast, errorMessage);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await mutationFn(variables);

        // 캐시 무효화
        if (invalidateCache) {
          const keys = Array.isArray(invalidateCache)
            ? invalidateCache
            : [invalidateCache];
          keys.forEach((key) => apiClient.clearCache(key));
        }

        onSuccess?.(result, variables);

        if (successMessage) {
          toast.showCustomSuccess("성공", successMessage);
        }

        return result;
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error("Unknown error");
        setError(errorObj);
        onError?.(errorObj, variables);
        handleError(errorObj, "Mutation");

        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      mutationFn,
      onSuccess,
      onError,
      successMessage,
      invalidateCache,
      handleError,
      toast,
    ]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}

// =================================
// 특화된 뮤테이션 훅들
// =================================

/**
 * 농장 생성 훅
 */
export function useCreateFarm(options: UseMutationOptions<any, any> = {}) {
  return useMutation((farmData) => apiClient.post("/api/farms", farmData), {
    successMessage: "농장이 성공적으로 등록되었습니다.",
    invalidateCache: ["farms"],
    ...options,
  });
}

/**
 * 농장 수정 훅
 */
export function useUpdateFarm(
  farmId: string,
  options: UseMutationOptions<any, any> = {}
) {
  return useMutation(
    (farmData) => apiClient.put(`/api/farms/${farmId}`, farmData),
    {
      successMessage: "농장 정보가 성공적으로 수정되었습니다.",
      invalidateCache: ["farms", `farm:${farmId}`],
      ...options,
    }
  );
}

/**
 * 농장 삭제 훅
 */
export function useDeleteFarm(options: UseMutationOptions<any, string> = {}) {
  return useMutation((farmId) => apiClient.delete(`/api/farms/${farmId}`), {
    successMessage: "농장이 성공적으로 삭제되었습니다.",
    invalidateCache: ["farms"],
    ...options,
  });
}
