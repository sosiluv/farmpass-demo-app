"use client";

import { useEffect } from "react";
import { logSystemResources } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";

/**
 * 시스템 성능 모니터링을 담당하는 클라이언트 컴포넌트
 * 브라우저 환경에서만 실행되며, 주기적으로 시스템 리소스를 모니터링합니다.
 */
export function SystemMonitor() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startMonitoring = () => {
      // 즉시 한 번 실행
      logSystemResources().catch((error) => {
        devLog.error("[SYSTEM_MONITOR] 초기 리소스 체크 실패:", error);
      });

      // 5분마다 시스템 리소스 모니터링
      intervalId = setInterval(() => {
        logSystemResources().catch((error) => {
          devLog.error("[SYSTEM_MONITOR] 리소스 체크 실패:", error);
        });
      }, 5 * 60 * 1000); // 5분

      devLog.log("[SYSTEM_MONITOR] 시스템 리소스 모니터링 시작 (5분 간격)");
    };

    // 컴포넌트 마운트 시 모니터링 시작
    startMonitoring();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        devLog.log("[SYSTEM_MONITOR] 시스템 리소스 모니터링 중지");
      }
    };
  }, []);

  // 화면에 렌더링되지 않는 모니터링 전용 컴포넌트
  return null;
}

export default SystemMonitor;
