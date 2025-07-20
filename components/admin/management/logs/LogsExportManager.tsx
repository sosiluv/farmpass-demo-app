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
import { LABELS } from "@/lib/constants/management";

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
          row[LABELS.TIME] = formatDateTime(log.created_at);
          row[LABELS.LEVEL] = log.level?.toUpperCase() || LABELS.UNKNOWN;
          row[LABELS.ACTION] = log.action || "";
          row[LABELS.MESSAGE] = log.message || "";
        }

        if (options.includeUser) {
          row[LABELS.USER] = log.user_email || LABELS.SYSTEM_CSV;
          row[LABELS.IP_ADDRESS_CSV] = log.user_ip || LABELS.NO_DATA_CSV;
        }

        if (options.includeSystem) {
          row[LABELS.CATEGORY_CSV] = getLogCategory(log);
          row[LABELS.RESOURCE_ID_CSV] = log.resource_id || LABELS.NO_DATA_CSV;
        }

        if (options.includeMetadata) {
          row[LABELS.BROWSER] = log.user_agent || LABELS.NO_DATA_CSV;
          row[LABELS.ADDITIONAL_DATA] = log.metadata
            ? JSON.stringify(log.metadata)
            : LABELS.NO_DATA_CSV;
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
