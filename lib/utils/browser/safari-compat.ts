import { devLog } from "@/lib/utils/logging/dev-logger";
/**
 * Safari 프라이빗 브라우징 모드에서 localStorage 안전하게 사용
 */
export function safeLocalStorageAccess() {
  const isPrivateBrowsing = (() => {
    try {
      if (typeof window === "undefined") return false;

      // Safari 프라이빗 모드에서는 localStorage가 null이거나 접근 시 예외 발생
      const test = "safari_private_test";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return false;
    } catch (e) {
      return true;
    }
  })();

  return {
    isPrivateBrowsing,
    setItem: (key: string, value: string): boolean => {
      try {
        if (isPrivateBrowsing) {
          // devLog.warn(
          //   `프라이빗 브라우징 모드: localStorage.setItem(${key}) 스킵`
          // );
          return false;
        }
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        // devLog.warn(`localStorage.setItem(${key}) 실패:`, error);
        return false;
      }
    },
    getItem: (key: string): string | null => {
      try {
        if (isPrivateBrowsing) {
          // devLog.warn(
          //   `프라이빗 브라우징 모드: localStorage.getItem(${key}) 스킵`
          // );
          return null;
        }
        return localStorage.getItem(key);
      } catch (error) {
        // devLog.warn(`localStorage.getItem(${key}) 실패:`, error);
        return null;
      }
    },
    removeItem: (key: string): boolean => {
      try {
        if (isPrivateBrowsing) {
          // devLog.warn(
          //   `프라이빗 브라우징 모드: localStorage.removeItem(${key}) 스킵`
          // );
          return false;
        }
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        // devLog.warn(`localStorage.removeItem(${key}) 실패:`, error);
        return false;
      }
    },
    clear: (): boolean => {
      try {
        if (isPrivateBrowsing) {
          // devLog.warn("프라이빗 브라우징 모드: localStorage.clear() 스킵");
          return false;
        }
        localStorage.clear();
        return true;
      } catch (error) {
        devLog.warn("localStorage.clear() 실패:", error);
        return false;
      }
    },
  };
}

/**
 * Safari 프라이빗 브라우징 모드에서 sessionStorage 안전하게 사용
 */
export function safeSessionStorageAccess() {
  const isPrivateBrowsing = (() => {
    try {
      if (typeof window === "undefined") return false;

      // Safari 프라이빗 모드에서는 sessionStorage가 null이거나 접근 시 예외 발생
      const test = "safari_session_private_test";
      sessionStorage.setItem(test, "test");
      sessionStorage.removeItem(test);
      return false;
    } catch (e) {
      return true;
    }
  })();

  return {
    isPrivateBrowsing,
    setItem: (key: string, value: string): boolean => {
      try {
        if (isPrivateBrowsing) {
          devLog.warn(
            `프라이빗 브라우징 모드: sessionStorage.setItem(${key}) 스킵`
          );
          return false;
        }
        sessionStorage.setItem(key, value);
        return true;
      } catch (error) {
        devLog.warn(`sessionStorage.setItem(${key}) 실패:`, error);
        return false;
      }
    },
    getItem: (key: string): string | null => {
      try {
        if (isPrivateBrowsing) {
          devLog.warn(
            `프라이빗 브라우징 모드: sessionStorage.getItem(${key}) 스킵`
          );
          return null;
        }
        return sessionStorage.getItem(key);
      } catch (error) {
        devLog.warn(`sessionStorage.getItem(${key}) 실패:`, error);
        return null;
      }
    },
    removeItem: (key: string): boolean => {
      try {
        if (isPrivateBrowsing) {
          devLog.warn(
            `프라이빗 브라우징 모드: sessionStorage.removeItem(${key}) 스킵`
          );
          return false;
        }
        sessionStorage.removeItem(key);
        return true;
      } catch (error) {
        devLog.warn(`sessionStorage.removeItem(${key}) 실패:`, error);
        return false;
      }
    },
    clear: (): boolean => {
      try {
        if (isPrivateBrowsing) {
          devLog.warn("프라이빗 브라우징 모드: sessionStorage.clear() 스킵");
          return false;
        }
        sessionStorage.clear();
        return true;
      } catch (error) {
        devLog.warn("sessionStorage.clear() 실패:", error);
        return false;
      }
    },
  };
}

/**
 * Safari에서 안전한 Notification API 접근
 */
export function safeNotificationAccess() {
  const isNotificationSupported =
    typeof window !== "undefined" && "Notification" in window;

  return {
    isSupported: isNotificationSupported,
    permission: isNotificationSupported
      ? window.Notification?.permission || "default"
      : "unsupported",
    requestPermission: async (): Promise<
      NotificationPermission | "unsupported"
    > => {
      if (!isNotificationSupported || !window.Notification) {
        return "unsupported";
      }

      try {
        if (window.Notification.requestPermission) {
          return await window.Notification.requestPermission();
        }
        return "default";
      } catch (error) {
        // devLog.warn("Notification permission request failed:", error);
        return "denied";
      }
    },
    show: (
      title: string,
      options?: NotificationOptions
    ): Notification | null => {
      if (!isNotificationSupported || !window.Notification) {
        // devLog.warn("Notification API not supported");
        return null;
      }

      try {
        return new window.Notification(title, options);
      } catch (error) {
        // devLog.warn("Failed to create notification:", error);
        return null;
      }
    },
  };
}
