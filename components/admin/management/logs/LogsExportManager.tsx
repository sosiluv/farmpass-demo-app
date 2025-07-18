import { downloadAdvancedCSV } from "@/lib/utils/data/csv-unified";
import { getLogCategory } from "@/lib/utils/logging/system-log";
import {
  formatDateTime,
  createKSTDateRange,
  toKSTDate,
} from "@/lib/utils/datetime/date";
import type { SystemLog } from "@/lib/types/system";
import type { LogsExportOptions } from "../exports";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface LogsExportManagerProps {
  logs: SystemLog[];
  children: (actions: {
    handleLogsExport: (options: LogsExportOptions) => Promise<void>;
  }) => React.ReactNode;
}

export function LogsExportManager({ logs, children }: LogsExportManagerProps) {
  // 로그 내보내기 처리
  const handleLogsExport = async (options: LogsExportOptions) => {
    try {
      // 필터링된 로그에서 내보내기 옵션에 따라 데이터 생성
      let exportLogs = [...logs];

      // 추가 필터링 - KST 기준
      if (options.startDate || options.endDate) {
        exportLogs = exportLogs.filter((log) => {
          // 로그의 created_at을 KST로 변환
          const logDate = new Date(log.created_at);
          const kstLogDate = toKSTDate(logDate);

          if (options.startDate) {
            // 시작 날짜를 KST 기준 00:00:00으로 설정
            const startDateKST = createKSTDateRange(options.startDate, false);
            if (kstLogDate < startDateKST) {
              return false;
            }
          }

          if (options.endDate) {
            // 종료 날짜를 KST 기준 23:59:59로 설정
            const endDateKST = createKSTDateRange(options.endDate, true);
            if (kstLogDate > endDateKST) {
              return false;
            }
          }

          return true;
        });
      }

      if (options.levelFilter !== "all") {
        exportLogs = exportLogs.filter(
          (log) => log.level === options.levelFilter
        );
      }
      if (options.categoryFilter !== "all") {
        exportLogs = exportLogs.filter(
          (log) => getLogCategory(log) === options.categoryFilter
        );
      }

      // CSV 데이터 생성
      const csvData = (exportLogs || []).map((log) => {
        const row: Record<string, any> = {};

        if (options.includeBasic) {
          row["시간"] = formatDateTime(log.created_at);
          row["레벨"] = log.level?.toUpperCase() || "UNKNOWN";
          row["액션"] = log.action || "";
          row["메시지"] = log.message || "";
        }

        if (options.includeUser) {
          row["사용자"] = log.user_email || "시스템";
          row["IP주소"] = log.user_ip || "-";
        }

        if (options.includeSystem) {
          row["카테고리"] = getLogCategory(log);
          row["리소스ID"] = log.resource_id || "-";
        }

        if (options.includeMetadata) {
          row["브라우저"] = log.user_agent || "-";
          row["추가데이터"] = log.metadata ? JSON.stringify(log.metadata) : "-";
        }

        return row;
      });

      downloadAdvancedCSV(csvData, {
        filename: "system-logs",
        includeDate: true,
        includeBOM: true,
      });
    } catch (error) {
      devLog.error("로그 내보내기 오류:", error);

      throw error;
    }
  };

  return (
    <>
      {children({
        handleLogsExport,
      })}
    </>
  );
}
