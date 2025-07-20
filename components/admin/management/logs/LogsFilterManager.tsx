import { useState, useMemo } from "react";
import type { SystemLog, LogFilter } from "@/lib/types/system";
import { getLogCategory } from "@/lib/utils/logging/system-log";
import {
  createKSTDateRange,
  toDateString,
  toKSTDate,
} from "@/lib/utils/datetime/date";

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

      // 날짜 필터 (AND 조건) - KST 기준
      if (filters.startDate || filters.endDate) {
        // 로그의 created_at을 KST로 변환
        const logDate = new Date(log.created_at);
        const kstLogDate = toKSTDate(logDate);

        if (filters.startDate) {
          // 시작 날짜를 KST 기준 00:00:00으로 설정
          const startDateStr = toDateString(filters.startDate);
          const startDateKST = createKSTDateRange(startDateStr, false);
          if (kstLogDate < startDateKST) {
            return false;
          }
        }

        if (filters.endDate) {
          // 종료 날짜를 KST 기준 23:59:59로 설정
          const endDateStr = toDateString(filters.endDate);
          const endDateKST = createKSTDateRange(endDateStr, true);
          if (kstLogDate > endDateKST) {
            return false;
          }
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
