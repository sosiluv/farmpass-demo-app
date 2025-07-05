"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface InstallInfo {
  canInstall: boolean;
  platform: "iOS" | "Android" | "Desktop" | "Unknown";
  method: "banner" | "manual" | "none";
  reason?: string;
  isStandalone: boolean;
  userAgent: string;
}

interface PWAContextType {
  installInfo: InstallInfo;
  isLoading: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

// 브라우저 환경 체크 함수를 메모이제이션
const checkInstallability = (): InstallInfo => {
  const userAgent = navigator.userAgent;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);

  // 이미 PWA로 실행 중이면 설치 불필요
  if (isStandalone) {
    return {
      canInstall: false,
      platform: "Unknown",
      method: "none",
      reason: "이미 PWA 모드로 실행 중",
      isStandalone: true,
      userAgent,
    };
  }

  // iOS Safari
  if (isIOS && isSafari) {
    return {
      canInstall: true,
      platform: "iOS",
      method: "manual",
      reason: "Safari 공유 버튼을 통해 설치 가능",
      isStandalone: false,
      userAgent,
    };
  }

  // Android Chrome
  if (isAndroid && isChrome) {
    return {
      canInstall: true,
      platform: "Android",
      method: "banner",
      reason: "Chrome 설치 배너 표시 가능",
      isStandalone: false,
      userAgent,
    };
  }

  // Android Samsung Internet
  if (isAndroid && /SamsungBrowser/.test(userAgent)) {
    return {
      canInstall: true,
      platform: "Android",
      method: "manual",
      reason: "Samsung Internet 메뉴를 통해 설치 가능",
      isStandalone: false,
      userAgent,
    };
  }

  // Android Firefox
  if (isAndroid && isFirefox) {
    return {
      canInstall: true,
      platform: "Android",
      method: "manual",
      reason: "Firefox 메뉴를 통해 설치 가능",
      isStandalone: false,
      userAgent,
    };
  }

  // Desktop Chrome
  if (!isAndroid && !isIOS && isChrome) {
    return {
      canInstall: true,
      platform: "Desktop",
      method: "banner",
      reason: "Chrome 주소창 옆 설치 버튼 표시",
      isStandalone: false,
      userAgent,
    };
  }

  // Desktop Edge
  if (!isAndroid && !isIOS && isEdge) {
    return {
      canInstall: true,
      platform: "Desktop",
      method: "banner",
      reason: "Edge 주소창 옆 설치 버튼 표시",
      isStandalone: false,
      userAgent,
    };
  }

  // 지원되지 않는 브라우저
  return {
    canInstall: false,
    platform: "Unknown",
    method: "none",
    reason: "지원되지 않는 브라우저",
    isStandalone: false,
    userAgent,
  };
};

export function PWAProvider({ children }: { children: ReactNode }) {
  const [installInfo, setInstallInfo] = useState<InstallInfo>({
    canInstall: false,
    platform: "Unknown",
    method: "none",
    isStandalone: false,
    userAgent: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== "undefined") {
      const info = checkInstallability();
      setInstallInfo(info);
      setIsLoading(false);
      devLog.log("PWA 설치 가능 여부 체크 (Provider):", info);
    }
  }, []);

  // Context 값 메모이제이션
  const contextValue = useMemo(
    () => ({
      installInfo,
      isLoading,
    }),
    [installInfo, isLoading]
  );

  return (
    <PWAContext.Provider value={contextValue}>{children}</PWAContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWAInstall must be used within a PWAProvider");
  }
  return context.installInfo;
}

export function usePWALoading() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWALoading must be used within a PWAProvider");
  }
  return context.isLoading;
}
