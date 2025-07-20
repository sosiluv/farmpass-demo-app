import { useSystemLogsQuery } from "@/lib/hooks/query/use-system-logs-query";
import type { SystemLog } from "@/lib/types/system";

interface LogsDataManagerProps {
  children: (data: {
    logs: SystemLog[];
    isLoading: boolean;
    error: string | null;
    lastUpdate: Date;
    refetch: () => void;
  }) => React.ReactNode;
}

export function LogsDataManager({ children }: LogsDataManagerProps) {
  const {
    data: logs = [],
    isLoading,
    error,
    dataUpdatedAt,
    refetch,
  } = useSystemLogsQuery();

  return (
    <div>
      {children({
        logs,
        isLoading,
        error: error?.message || null,
        lastUpdate: new Date(dataUpdatedAt),
        refetch,
      })}
    </div>
  );
}
