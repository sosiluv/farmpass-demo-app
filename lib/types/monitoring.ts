// 모니터링 관련 타입 정의

// AnalyticsCard 타입
export interface AnalyticsData {
  success?: boolean;
  error?: string;
  message?: string;
  details?: string;
  visitors: number;
  pageviews: number;
  sessions?: number;
  newUsers?: number;
  bounceRate?: number;
  avgDuration?: number;
}

// ErrorLogsCard 타입
export interface ErrorLog {
  timestamp: string;
  level: string;
  message: string;
}

// SystemStatusCard 타입
export interface SystemPerformance {
  totalResponseTime: string;
  databaseResponseTime: string;
  cpu: {
    user: string;
    system: string;
    total: string;
  };
}

export interface SystemMemory {
  used: number;
  total: number;
  external: number;
  status: string;
}

export interface SystemCpu {
  user: number;
  system: number;
  total: number;
  threshold: number;
  status: string;
}

export interface SystemInfo {
  farmCount: number;
  visitorCount: number;
  memory: SystemMemory;
  cpu: SystemCpu;
  nodeVersion: string;
  platform: string;
  arch: string;
}

export interface SystemServices {
  database: string;
  api: string;
  memory: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: string;
  version: string;
  performance: SystemPerformance;
  system: SystemInfo;
  services: SystemServices;
}

export interface SystemStatusData {
  timestamp: string;
  health: SystemHealth;
}

// TechStackCard 타입
export interface TechStackData {
  framework?: string;
  runtime?: string;
  react?: string;
  typescript?: string;
  database?: string;
  authentication?: string;
  deployment?: string;
  ui?: string;
  state?: string;
  monitoring?: string;
  analytics?: string;
}

// UptimeCard 타입
export interface UptimeMonitor {
  id: number;
  friendly_name: string;
  status: number;
  all_time_uptime_ratio: number;
  custom_uptime_ratio?: number;
  url?: string;
  interval?: number;
  type?: number;
  port?: string;
  create_datetime?: number;
}

export interface UptimeData {
  monitors?: UptimeMonitor[];
  success?: boolean;
  error?: string;
  message?: string;
  details?: string;
}
