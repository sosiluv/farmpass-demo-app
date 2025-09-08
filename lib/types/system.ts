import type { LogLevel } from "@/lib/types/common";

export interface LogFilter {
  search?: string;
  level?: LogLevel;
  startDate?: Date;
  endDate?: Date;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  results: {
    visitor: { deleted: number; total: number };
    profile: { deleted: number; total: number };
  };
}
