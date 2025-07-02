import { useState, useMemo } from "react";
import type { SystemLog, LogFilter } from "@/lib/types/system";
import { isAuditLog, getLogCategory } from "@/lib/utils/logging/system-log";

interface LogsFilterManagerProps {
  logs: SystemLog[];
  children: (data: {
    filters: LogFilter;
    setFilters: (filters: LogFilter) => void;
    auditFilter: string;
    setAuditFilter: (filter: string) => void;
    categoryFilter: string;
    setCategoryFilter: (filter: string) => void;
    filteredLogs: SystemLog[];
  }) => React.ReactNode;
}

export function LogsFilterManager({ logs, children }: LogsFilterManagerProps) {
  const [filters, setFilters] = useState<LogFilter>({
    search: "",
    level: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [auditFilter, setAuditFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // 필터링된 로그 계산
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 기존 필터
      if (
        filters.search &&
        !(
          log.message?.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.action?.toLowerCase().includes(filters.search.toLowerCase())
        )
      ) {
        return false;
      }
      if (filters.level && log.level !== filters.level) {
        return false;
      }
      if (filters.startDate && new Date(log.created_at) < filters.startDate) {
        return false;
      }
      if (filters.endDate && new Date(log.created_at) > filters.endDate) {
        return false;
      }

      // 감사 로그 필터
      if (auditFilter === "audit" && !isAuditLog(log)) {
        return false;
      }
      if (auditFilter === "system" && isAuditLog(log)) {
        return false;
      }

      // 카테고리 필터
      if (categoryFilter !== "all" && getLogCategory(log) !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [logs, filters, auditFilter, categoryFilter]);

  return (
    <>
      {children({
        filters,
        setFilters,
        auditFilter,
        setAuditFilter,
        categoryFilter,
        setCategoryFilter,
        filteredLogs,
      })}
    </>
  );
}
