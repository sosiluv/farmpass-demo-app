import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { DebugInfo } from "@/lib/types/debug";

export function useDebugInfo(enabled: boolean) {
  const pathname = usePathname() || "";
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 성능 정보 수집
  const collectPerformanceInfo = useCallback(() => {
    const performanceInfo: DebugInfo["performanceInfo"] = {
      navigationStart: performance.timeOrigin,
      domContentLoaded: 0,
      loadComplete: 0,
    };

    // Navigation Timing API (최신)
    if ("getEntriesByType" in performance) {
      const navigationEntries = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        performanceInfo.domContentLoaded = Math.round(
          nav.domContentLoadedEventEnd - nav.fetchStart
        );
        performanceInfo.loadComplete = Math.round(
          nav.loadEventEnd - nav.fetchStart
        );
      }
    }

    // Paint Timing API
    if ("getEntriesByType" in performance) {
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          performanceInfo.firstContentfulPaint = Math.round(entry.startTime);
        }
      });

      // Largest Contentful Paint
      const lcpEntries = performance.getEntriesByType(
        "largest-contentful-paint"
      ) as any[];
      if (lcpEntries.length > 0) {
        performanceInfo.largestContentfulPaint = Math.round(
          lcpEntries[lcpEntries.length - 1].startTime
        );
      }
    }

    return performanceInfo;
  }, []);

  // 메모리 정보 수집
  const collectMemoryInfo = useCallback(() => {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return undefined;
  }, []);

  // 디버그 정보 업데이트
  const updateDebugInfo = useCallback(() => {
    if (!enabled) return;

    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      pathname: pathname,
      method: "GET",
      networkStatus: navigator.onLine ? "online" : "offline",
      memoryUsage: collectMemoryInfo(),
      performanceInfo: collectPerformanceInfo(),
    };

    setDebugInfo(info);
    setLastUpdate(new Date());
  }, [enabled, pathname, collectMemoryInfo, collectPerformanceInfo]);

  return {
    debugInfo,
    lastUpdate,
    updateDebugInfo,
  };
}
