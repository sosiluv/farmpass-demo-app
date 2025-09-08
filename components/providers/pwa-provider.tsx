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
import { getDeviceInfo } from "@/lib/utils/browser/device-detection";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

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
  deferredPrompt: any; // beforeinstallprompt 이벤트 저장
  triggerInstall: () => Promise<any>; // 실제 설치 트리거 함수
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

// 브라우저 환경 체크 함수를 메모이제이션
const checkInstallability = (): InstallInfo => {
  const deviceInfo = getDeviceInfo();
  const userAgent = deviceInfo.userAgent;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOS = deviceInfo.os === "iOS";
  const isAndroid = deviceInfo.os === "Android";
  const isChrome = deviceInfo.browser === "Chrome";
  const isSafari = deviceInfo.browser === "Safari";
  const isFirefox = deviceInfo.browser === "Firefox";
  const isEdge = deviceInfo.browser === "Edge";
  const isSamsung = deviceInfo.browser === "Samsung";

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

  // 이전에 설치 완료된 경우 (localStorage 체크)
  const installCompleted = localStorage.getItem("pwa_install_completed");
  if (installCompleted) {
    return {
      canInstall: false,
      platform: "Unknown",
      method: "none",
      reason: "이미 설치 완료됨",
      isStandalone: false,
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
  if (isAndroid && isSamsung) {
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
  const { showWarning } = useCommonToast();
  const [installInfo, setInstallInfo] = useState<InstallInfo>({
    canInstall: false,
    platform: "Unknown",
    method: "none",
    isStandalone: false,
    userAgent: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // 실제 설치 트리거 함수
  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        // 브라우저 네이티브 설치 프롬프트 표시
        const result = await deferredPrompt.prompt();

        // 프롬프트 사용 후 초기화
        setDeferredPrompt(null);

        return result;
      } catch (error) {
        devLog.error("설치 프롬프트 실행 실패:", error);
        showWarning("설치 오류", "설치 중 오류가 발생했습니다.");
        throw error;
      }
    } else {
      devLog.warn("설치 프롬프트가 사용 불가능합니다");
      showWarning(
        "설치 불가",
        "설치 프롬프트를 사용할 수 없습니다. 이미 설치했거나, 브라우저가 지원하지 않는 환경입니다."
      );
      throw new Error("설치 프롬프트를 사용할 수 없습니다");
    }
  };

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== "undefined") {
      const info = checkInstallability();
      setInstallInfo(info);
      setIsLoading(false);

      // PWA 삭제 감지 및 localStorage 정리 함수
      const checkPWAUninstall = () => {
        const installCompleted = localStorage.getItem("pwa_install_completed");
        const isStandalone = window.matchMedia(
          "(display-mode: standalone)"
        ).matches;

        // 설치 완료 기록이 있지만 standalone 모드가 아닌 경우
        // → 사용자가 PWA를 삭제했을 가능성 있음
        if (installCompleted && !isStandalone) {
          // beforeinstallprompt 이벤트 재확인을 더 안전하게 처리
          let canReinstall = false;
          let testHandlerAdded = false;

          const testPrompt = (e: Event) => {
            canReinstall = true;
            e.preventDefault();
          };

          try {
            window.addEventListener("beforeinstallprompt", testPrompt);
            testHandlerAdded = true;
          } catch (error) {
            devLog.warn("beforeinstallprompt 이벤트 리스너 추가 실패:", error);
          }

          // 짧은 시간 후 이벤트 확인
          setTimeout(() => {
            if (testHandlerAdded) {
              try {
                window.removeEventListener("beforeinstallprompt", testPrompt);
              } catch (error) {
                devLog.warn(
                  "beforeinstallprompt 이벤트 리스너 제거 실패:",
                  error
                );
              }
            }

            if (canReinstall) {
              // PWA가 삭제된 것으로 판단, localStorage 정리
              localStorage.removeItem("pwa_install_completed");
              localStorage.removeItem("pwa_install_dismissed");

              // 설치 가능 상태로 업데이트 (현재 상태와 다를 때만)
              const updatedInfo = checkInstallability();
              if (updatedInfo.canInstall !== installInfo.canInstall) {
                setInstallInfo(updatedInfo);
              }
            }
          }, 1000);
        }
      };

      // beforeinstallprompt 이벤트 리스너 추가
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();

        // 이벤트를 저장하여 나중에 사용
        setDeferredPrompt(e);

        // 이벤트가 발생하면 아직 설치되지 않은 것으로 판단
        const updatedInfo = checkInstallability();
        // 현재 상태와 다를 때만 업데이트
        if (
          updatedInfo.canInstall !== installInfo.canInstall ||
          updatedInfo.reason !== installInfo.reason
        ) {
          setInstallInfo(updatedInfo);
        }
      };

      const handleAppInstalled = () => {
        // 설치 완료 시 localStorage에 저장
        localStorage.setItem("pwa_install_completed", Date.now().toString());
        setInstallInfo({
          canInstall: false,
          platform: "Unknown",
          method: "none",
          reason: "설치 완료됨",
          isStandalone: false,
          userAgent: navigator.userAgent,
        });
      };

      // 페이지 로드 시 PWA 삭제 체크 (한 번만 실행)
      let hasCheckedUninstall = false;

      const checkPWAUninstallOnce = () => {
        if (hasCheckedUninstall) return;
        hasCheckedUninstall = true;
        checkPWAUninstall();
      };

      checkPWAUninstallOnce();

      // 포커스 이벤트로 PWA 삭제 재체크 (사용자가 다른 탭에서 돌아올 때)
      // 짧은 간격으로 중복 실행 방지
      let lastVisibilityCheck = 0;
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          const now = Date.now();
          if (now - lastVisibilityCheck > 5000) {
            // 5초 간격 제한
            lastVisibilityCheck = now;
            setTimeout(checkPWAUninstall, 500);
          }
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, []);

  // Context 값 메모이제이션
  const contextValue = useMemo(
    () => ({
      installInfo,
      isLoading,
      deferredPrompt,
      triggerInstall,
    }),
    [installInfo, isLoading, deferredPrompt]
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
  return {
    ...context.installInfo,
    triggerInstall: context.triggerInstall,
  };
}

export function usePWALoading() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWALoading must be used within a PWAProvider");
  }
  return context.isLoading;
}
