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
}

export interface DebugPanelProps {
  show: boolean;
}
