import type { LogLevel } from "@/lib/types/common";

export type { LogLevel };

export type LogCategory =
  | "auth"
  | "farm"
  | "member"
  | "visitor"
  | "system"
  | "backup"
  | "settings";

export interface SystemLog {
  id: string;
  created_at: string;
  level: LogLevel;
  action: string;
  message: string;
  user_id?: string;
  user_email?: string;
  user_ip?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
}

export interface LogFilter {
  search?: string;
  level?: LogLevel;
  startDate?: Date;
  endDate?: Date;
}

export interface LogStats {
  total: number;
  byLevel: {
    info: number;
    warn: number;
    error: number;
    debug: number;
  };
  recentErrors: number;
}
