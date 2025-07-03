import { useEffect, useState, useCallback, useRef } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";

export interface UseTimeoutOptions {
  timeout?: number; // 타임아웃 시간 (ms)
  onTimeout?: () => void; // 타임아웃 시 호출되는 함수
  onRetry?: () => void; // 재시도 시 호출되는 함수
}

export interface UseTimeoutReturn {
  timeoutReached: boolean;
  isTimedOut: boolean;
  retry: () => void;
  resetTimeout: () => void;
  startTimeout: () => void;
  stopTimeout: () => void;
}

/**
 * 타임아웃 관리 훅
 *
 * @param isLoading - 로딩 상태
 * @param options - 타임아웃 설정
 * @returns 타임아웃 상태와 제어 함수들
 */
export function useTimeout(
  isLoading: boolean,
  options: UseTimeoutOptions = {}
): UseTimeoutReturn {
  const {
    timeout = 10000, // 기본 10초
    onTimeout,
    onRetry,
  } = options;

  const [timeoutReached, setTimeoutReached] = useState(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);

  // 옵션을 ref에 저장하여 useEffect에서 안전하게 사용
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // 타임아웃 중지
  const stopTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // 타임아웃 시작
  const startTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    const id = setTimeout(() => {
      setTimeoutReached(true);
      optionsRef.current.onTimeout?.();
    }, optionsRef.current.timeout || 10000);

    timeoutIdRef.current = id;
  }, []);

  // 타임아웃 리셋
  const resetTimeout = useCallback(() => {
    setTimeoutReached(false);
    stopTimeout();
  }, [stopTimeout]);

  // 재시도 함수
  const retry = useCallback(() => {
    resetTimeout();
    optionsRef.current.onRetry?.();
  }, [resetTimeout]);

  // 로딩 상태 변경 감지 - 함수 의존성 제거
  useEffect(() => {
    if (isLoading && !timeoutReached) {
      // 직접 타임아웃 시작
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      const id = setTimeout(() => {
        setTimeoutReached(true);
        optionsRef.current.onTimeout?.();
      }, optionsRef.current.timeout || 10000);

      timeoutIdRef.current = id;
    } else if (!isLoading) {
      // 직접 타임아웃 중지
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setTimeoutReached(false);
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [isLoading, timeoutReached]); // 함수 의존성 제거

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return {
    timeoutReached,
    isTimedOut: timeoutReached,
    retry,
    resetTimeout,
    startTimeout,
    stopTimeout,
  };
}

/**
 * 데이터 페칭 타임아웃 훅
 *
 * @param isLoading - 로딩 상태
 * @param refetch - 데이터 재페칭 함수
 * @param options - 타임아웃 설정
 * @returns 타임아웃 상태와 재시도 함수
 */
export function useDataFetchTimeout(
  isLoading: boolean,
  refetch: () => void | Promise<void>,
  options: Omit<UseTimeoutOptions, "onRetry"> = {}
) {
  const refetchRef = useRef(refetch);

  // refetch 함수를 ref에 저장하여 의존성 변경 방지
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const handleRetry = useCallback(async () => {
    try {
      await refetchRef.current();
    } catch (error) {
      devLog.error("Retry failed:", error);
    }
  }, []);

  return useTimeout(isLoading, {
    ...options,
    onRetry: handleRetry,
  });
}

/**
 * 다중 로딩 상태 타임아웃 훅
 *
 * @param loadingStates - 여러 로딩 상태의 배열
 * @param refetch - 데이터 재페칭 함수
 * @param options - 타임아웃 설정
 * @returns 타임아웃 상태와 재시도 함수
 */
export function useMultipleLoadingTimeout(
  loadingStates: boolean[],
  refetch: () => void | Promise<void>,
  options: Omit<UseTimeoutOptions, "onRetry"> = {}
) {
  const isAnyLoading = loadingStates.some(Boolean);

  return useDataFetchTimeout(isAnyLoading, refetch, options);
}
