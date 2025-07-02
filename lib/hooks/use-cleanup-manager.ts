import { useState, useEffect } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { CleanupStatus } from "@/lib/types/settings";

export function useCleanupManager() {
  const toast = useCommonToast();
  const [cleanupStatus, setCleanupStatus] = useState<CleanupStatus | null>(
    null
  );
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [lastCleanupSuccess, setLastCleanupSuccess] = useState<string | null>(
    null
  );

  // 정리 상태 조회
  const fetchCleanupStatus = async () => {
    try {
      setStatusLoading(true);
      devLog.log("정리 상태 조회 시작");

      const response = await fetch("/api/admin/logs/cleanup");
      devLog.log("응답 받음:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        devLog.error("응답 오류:", errorText);
        throw new Error(`정리 상태 조회에 실패했습니다. (${response.status})`);
      }

      const contentType = response.headers.get("content-type");
      devLog.log("Content-Type:", contentType);

      if (!contentType?.includes("application/json")) {
        const responseText = await response.text();
        devLog.error("JSON이 아닌 응답:", responseText.substring(0, 200));
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
      }

      const data = await response.json();
      devLog.log("정리 상태 데이터:", data);
      setCleanupStatus(data);
    } catch (error) {
      devLog.error("정리 상태 조회 오류:", error);
      toast.showCustomError(
        "오류",
        error instanceof Error
          ? error.message
          : "정리 상태를 조회할 수 없습니다."
      );
    } finally {
      setStatusLoading(false);
    }
  };

  // 정리 작업 실행
  const executeCleanup = async (type: "system_logs" | "all") => {
    try {
      setCleanupLoading(true);
      devLog.log("정리 작업 시작:", type);

      const response = await fetch("/api/admin/logs/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      });

      devLog.log("정리 작업 응답:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        devLog.error("정리 작업 응답 오류:", errorText);
        throw new Error(`정리 작업에 실패했습니다. (${response.status})`);
      }

      const contentType = response.headers.get("content-type");
      devLog.log("정리 작업 Content-Type:", contentType);

      if (!contentType?.includes("application/json")) {
        const responseText = await response.text();
        devLog.error(
          "정리 작업 - JSON이 아닌 응답:",
          responseText.substring(0, 200)
        );
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
      }

      const data = await response.json();
      devLog.log("정리 작업 완료:", data);

      toast.showCustomSuccess(
        "✅ 정리 완료",
        `${data.message}\n상태가 자동으로 새로고침되었습니다.`
      );

      // 성공 상태 표시
      setLastCleanupSuccess(type === "all" ? "모든 데이터" : "시스템 로그");

      // 정리 후 상태 다시 조회
      await fetchCleanupStatus();

      // 3초 후 성공 상태 제거
      setTimeout(() => {
        setLastCleanupSuccess(null);
      }, 3000);
    } catch (error) {
      devLog.error("로그 정리 오류:", error);
      toast.showCustomError(
        "오류",
        error instanceof Error
          ? error.message
          : "정리 작업 중 오류가 발생했습니다."
      );
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
    fetchCleanupStatus,
    executeCleanup,
  };
}
