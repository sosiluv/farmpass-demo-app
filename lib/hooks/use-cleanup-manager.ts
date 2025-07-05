import { useState, useEffect } from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { CleanupStatus } from "@/lib/types/settings";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";

export function useCleanupManager() {
  const [cleanupStatus, setCleanupStatus] = useState<CleanupStatus | null>(
    null
  );
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [lastCleanupSuccess, setLastCleanupSuccess] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // 정리 상태 조회
  const fetchCleanupStatus = async () => {
    try {
      setStatusLoading(true);
      setError(null);
      devLog.log("정리 상태 조회 시작");

      const data = await apiClient("/api/admin/logs/cleanup", {
        context: "정리 상태 조회",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              setError(errorMessage);
            },
          });
        },
      });

      devLog.log("정리 상태 데이터:", data);
      setCleanupStatus(data);
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setStatusLoading(false);
    }
  };

  // 정리 작업 실행
  const executeCleanup = async (type: "system_logs" | "all") => {
    try {
      setCleanupLoading(true);
      setError(null);
      devLog.log("정리 작업 시작:", type);

      const data = await apiClient("/api/admin/logs/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
        context: "정리 작업 실행",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              setError(errorMessage);
            },
          });
        },
      });

      devLog.log("정리 작업 완료:", data);

      // 성공 상태 표시
      setLastCleanupSuccess(type === "all" ? "모든 데이터" : "시스템 로그");

      // 정리 후 상태 다시 조회
      await fetchCleanupStatus();

      // 3초 후 성공 상태 제거
      setTimeout(() => {
        setLastCleanupSuccess(null);
      }, 3000);
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setCleanupLoading(false);
    }
  };

  // 컴포넌트 마운트 시 정리 상태 조회
  useEffect(() => {
    fetchCleanupStatus();
  }, []);

  return {
    cleanupStatus,
    cleanupLoading,
    statusLoading,
    lastCleanupSuccess,
    error,
    fetchCleanupStatus,
    executeCleanup,
  };
}
