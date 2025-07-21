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
  user_id: string | null;
  user_email: string | null;
  user_ip: string | null;
  user_agent: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any> | null;
}

export interface LogFilter {
  search?: string;
  level?: LogLevel;
  startDate?: Date;
  endDate?: Date;
}
