/**
 * =================================
 * 📡 공통 데이터 Fetching 훅
 * =================================
 * 표준화된 데이터 가져오기 패턴 제공
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/utils/api/api-client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

export interface UseFetchOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  showErrorToast?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * 공통 데이터 fetching 훅
 * @param endpoint API 엔드포인트
 * @param options 옵션
 */
export function useFetch<T = any>(
  endpoint: string | null,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    showErrorToast = true,
    cacheKey,
    cacheTtl,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showError } = useCommonToast();
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!endpoint || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(
        endpoint,
        cacheKey && cacheTtl
          ? {
              key: cacheKey,
              ttl: cacheTtl,
            }
          : undefined
      );

      if (mountedRef.current) {
        setData(response);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (mountedRef.current) {
        setError(error);

        if (showErrorToast) {
          showError("DATA_LOAD_FAILED");
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, enabled, cacheKey, cacheTtl, showErrorToast, showError]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
}

/**
 * 조건부 fetching 훅
 * 특정 조건이 만족될 때만 데이터를 가져옴
 */
export function useConditionalFetch<T = any>(
  endpoint: string,
  condition: boolean,
  options: Omit<UseFetchOptions, "enabled"> = {}
): UseFetchReturn<T> {
  return useFetch<T>(endpoint, { ...options, enabled: condition });
}

/**
 * 인터벌 기반 fetching 훅
 * 주기적으로 데이터를 새로고침
 */
export function useIntervalFetch<T = any>(
  endpoint: string,
  interval: number,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const fetchResult = useFetch<T>(endpoint, options);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (interval > 0 && options.enabled !== false) {
      intervalRef.current = setInterval(() => {
        fetchResult.refetch();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [interval, options.enabled, fetchResult.refetch]);

  return fetchResult;
}
