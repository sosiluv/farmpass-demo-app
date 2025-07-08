"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DebugPanel } from "@/components/debug/debug-panel";
import { useSystemSettingsContext } from "./system-settings-provider";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface SystemModeContextType {
  debugMode: boolean;
  maintenanceMode: boolean;
  setDebugMode: (enabled: boolean) => void;
  setMaintenanceMode: (enabled: boolean) => void;
  addDebugLog: (message: string, data?: any) => void;
  refreshSystemModes: () => Promise<void>;
}

const SystemModeContext = createContext<SystemModeContextType | undefined>(
  undefined
);

export function useSystemMode() {
  const context = useContext(SystemModeContext);
  if (context === undefined) {
    throw new Error("useSystemMode must be used within a SystemModeProvider");
  }
  return context;
}

// 디버그 전용 훅 (기존 호환성 유지)
export function useDebug() {
  const { debugMode, setDebugMode, addDebugLog, refreshSystemModes } =
    useSystemMode();
  return {
    debugMode,
    setDebugMode,
    addDebugLog,
    refreshDebugMode: refreshSystemModes, // 기존 이름 유지
  };
}

interface SystemModeProviderProps {
  children: React.ReactNode;
  initialDebugMode?: boolean;
  initialMaintenanceMode?: boolean;
}

export function SystemModeProvider({
  children,
  initialDebugMode = false,
  initialMaintenanceMode = false,
}: SystemModeProviderProps) {
  const { settings, refetch, error } = useSystemSettingsContext();
  const [debugMode, setDebugMode] = useState(initialDebugMode);
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialMaintenanceMode
  );
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // settings가 변경될 때마다 시스템 모드 상태 업데이트
  useEffect(() => {
    try {
      if (settings) {
        const newDebugMode = settings.debugMode || false;
        const newMaintenanceMode = settings.maintenanceMode || false;

        if (newDebugMode !== debugMode) {
          setDebugMode(newDebugMode);
        }

        if (newMaintenanceMode !== maintenanceMode) {
          setMaintenanceMode(newMaintenanceMode);
        }
      }
    } catch (error) {
      devLog.error("[SYSTEM-MODE] Failed to update system modes:", error);
      // 에러 발생 시 기본값 유지
    }
  }, [settings, debugMode, maintenanceMode]);

  const refreshSystemModes = async () => {
    try {
      await refetch();
    } catch (error) {
      devLog.error("[SYSTEM-MODE] Failed to refresh system modes:", error);
    }
  };

  const addDebugLog = (message: string, data?: any) => {
    try {
      if (debugMode) {
        const timestamp = new Date().toISOString();
        const logMessage = data
          ? `${message} - ${JSON.stringify(data)}`
          : message;

        setDebugLogs((prev) => [
          `[${timestamp}] ${logMessage}`,
          ...prev.slice(0, 99), // 최대 100개 로그 유지
        ]);
      }
    } catch (error) {
      devLog.error("[SYSTEM-MODE] Failed to add debug log:", error);
    }
  };

  // 전역 에러 핸들링 (디버그 모드일 때만)
  useEffect(() => {
    if (debugMode && typeof window !== "undefined") {
      const handleError = (event: ErrorEvent) => {
        addDebugLog(`Global Error: ${event.message}`, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack,
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        addDebugLog(
          `Unhandled Promise Rejection: ${event.reason}`,
          event.reason
        );
      };

      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleUnhandledRejection);

      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection
        );
      };
    }
  }, [debugMode]);

  // 에러 발생 시 로그
  useEffect(() => {
    if (error) {
      devLog.error("[SYSTEM-MODE] Settings error:", error);
    }
  }, [error]);

  const contextValue: SystemModeContextType = {
    debugMode,
    maintenanceMode,
    setDebugMode,
    setMaintenanceMode,
    addDebugLog,
    refreshSystemModes,
  };

  return (
    <SystemModeContext.Provider value={contextValue}>
      {children}
      <DebugPanel show={debugMode} />
    </SystemModeContext.Provider>
  );
}

// 기존 DebugProvider 이름도 유지 (호환성)
export const DebugProvider = SystemModeProvider;
