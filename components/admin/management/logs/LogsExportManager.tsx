import { downloadAdvancedCSV } from "@/lib/utils/data/csv-unified";
import { isAuditLog, getLogCategory } from "@/lib/utils/logging/system-log";
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

      // 추가 필터링
      if (options.startDate) {
        exportLogs = exportLogs.filter(
          (log) => new Date(log.created_at) >= new Date(options.startDate!)
        );
      }
      if (options.endDate) {
        exportLogs = exportLogs.filter(
          (log) => new Date(log.created_at) <= new Date(options.endDate!)
        );
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
      if (options.auditFilter !== "all") {
        if (options.auditFilter === "audit") {
          exportLogs = exportLogs.filter((log) => isAuditLog(log));
        } else if (options.auditFilter === "system") {
          exportLogs = exportLogs.filter((log) => !isAuditLog(log));
        }
      }

      // CSV 데이터 생성
      const csvData = (exportLogs || []).map((log) => {
        const row: Record<string, any> = {};

        if (options.includeBasic) {
          row["시간"] = new Date(log.created_at).toLocaleString("ko-KR");
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
