/**
 * =================================
 * 🚨 공통 에러 처리 훅
 * =================================
 * 중복된 에러 처리 로직을 표준화
 */

import { useState, useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

export interface UseErrorHandlingReturn {
  error: Error | null;
  clearError: () => void;
  handleError: (error: unknown, showToast?: boolean) => void;
  withErrorHandling: <T>(
    fn: () => Promise<T>,
    showToast?: boolean
  ) => Promise<T | null>;
}

/**
 * 공통 에러 처리 훅
 */
export function useErrorHandling(): UseErrorHandlingReturn {
  const [error, setError] = useState<Error | null>(null);
  const { showError } = useCommonToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (error: unknown, showToast: boolean = true) => {
      devLog.error("Error occurred:", error);

      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      setError(errorInstance);

      if (showToast) {
        // 네트워크 오류 감지
        if (errorInstance.message.includes("fetch")) {
          showError("NETWORK_ERROR");
        } else if (
          errorInstance.message.includes("unauthorized") ||
          errorInstance.message.includes("403")
        ) {
          showError("UNAUTHORIZED");
        } else {
          showError("OPERATION_FAILED");
        }
      }
    },
    [showError]
  );

  /**
   * 에러 처리와 함께 비동기 함수 실행
   * @param fn 실행할 비동기 함수
   * @param showToast 에러 발생 시 토스트 표시 여부
   */
  const withErrorHandling = useCallback(
    async <T>(
      fn: () => Promise<T>,
      showToast: boolean = true
    ): Promise<T | null> => {
      try {
        clearError();
        return await fn();
      } catch (error) {
        handleError(error, showToast);
        return null;
      }
    },
    [clearError, handleError]
  );

  return {
    error,
    clearError,
    handleError,
    withErrorHandling,
  };
}

/**
 * 로딩과 에러 처리를 결합한 훅
 */
export function useAsyncOperation() {
  const [loading, setLoading] = useState(false);
  const { error, clearError, handleError } = useErrorHandling();

  const execute = useCallback(
    async <T>(
      fn: () => Promise<T>,
      showErrorToast: boolean = true
    ): Promise<T | null> => {
      setLoading(true);
      clearError();

      try {
        const result = await fn();
        return result;
      } catch (error) {
        handleError(error, showErrorToast);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleError]
  );

  return {
    loading,
    error,
    execute,
    clearError,
  };
}
