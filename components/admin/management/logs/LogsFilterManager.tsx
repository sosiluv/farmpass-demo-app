import { useState, useMemo } from "react";
import type { SystemLog } from "@/lib/types/common";
import type { LogFilter } from "@/lib/types/system";
import { getLogCategory } from "@/lib/utils/logging/system-log";
import { getKSTDayBoundsUTC } from "@/lib/utils/datetime/date";

interface LogsFilterManagerProps {
  logs: SystemLog[];
  children: (data: {
    filters: LogFilter;
    setFilters: (filters: LogFilter) => void;
    categoryFilters: string[];
    setCategoryFilters: (filters: string[]) => void;
    levelFilters: string[];
    setLevelFilters: (filters: string[]) => void;
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

  // OR 조건을 위한 다중 선택 필터
  const [categoryFilters, setCategoryFilters] = useState<string[]>(["all"]);
  const [levelFilters, setLevelFilters] = useState<string[]>(["all"]);

  // 필터링된 로그 계산
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 검색 필터 (AND 조건)
      if (
        filters.search &&
        !(
          log.message?.toLowerCase().includes(filters.search.toLowerCase()) ||
          log.action?.toLowerCase().includes(filters.search.toLowerCase())
        )
      ) {
        return false;
      }

      // 날짜 필터 (AND 조건) - 선택된 KST 날짜의 UTC 경계와 비교
      if (filters.startDate || filters.endDate) {
        const logInstant = new Date(log.created_at);

        if (filters.startDate) {
          const { startUTC } = getKSTDayBoundsUTC(filters.startDate);
          if (logInstant < startUTC) return false;
        }
        if (filters.endDate) {
          const { endUTC } = getKSTDayBoundsUTC(filters.endDate);
          if (logInstant > endUTC) return false;
        }
      }

      // 카테고리 필터 (OR 조건)
      if (!categoryFilters.includes("all")) {
        const logCategory = getLogCategory(log);
        if (!categoryFilters.includes(logCategory)) {
          return false;
        }
      }

      // 레벨 필터 (OR 조건)
      if (!levelFilters.includes("all")) {
        if (!levelFilters.includes(log.level)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filters, categoryFilters, levelFilters]);

  return (
    <>
      {children({
        filters,
        setFilters,
        categoryFilters,
        setCategoryFilters,
        levelFilters,
        setLevelFilters,
        filteredLogs,
      })}
    </>
  );
}
