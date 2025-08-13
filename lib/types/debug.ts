export interface DebugInfo {
  timestamp: string;
  userAgent: string;
  url: string;
  pathname: string;
  method: string;
  status?: number;
  duration?: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  networkStatus: "online" | "offline";
  performanceInfo?: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  // 확장: 디바이스 정보(선택)
  deviceType?: string;
  browser?: string;
  os?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  screenSize?: string;
  windowSize?: string;
  pixelRatio?: number;
}
