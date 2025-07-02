import { useState, useCallback } from "react";

export function useDebugLogs() {
  const [logs, setLogs] = useState<string[]>([]);

  // 로그 추가
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString("ko-KR");
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // 로그 초기화
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
