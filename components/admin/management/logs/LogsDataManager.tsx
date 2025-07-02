import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SystemLog } from "@/lib/types/system";

interface LogsDataManagerProps {
  children: (data: {
    logs: SystemLog[];
    isLoading: boolean;
    error: string | null;
    lastUpdate: Date;
    setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
    setLastUpdate: (date: Date) => void;
    setError: (error: string | null) => void;
    setIsLoading: (loading: boolean) => void;
  }) => React.ReactNode;
}

export function LogsDataManager({ children }: LogsDataManagerProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 시스템 로그 데이터 가져오기
  useEffect(() => {
    async function fetchLogs() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("system_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000); // 최대 5000개 로그만 가져오기

        if (fetchError) throw fetchError;
        setLogs(data || []);
        setLastUpdate(new Date());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "로그를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <>
      {children({
        logs,
        isLoading,
        error,
        lastUpdate,
        setLogs,
        setLastUpdate,
        setError,
        setIsLoading,
      })}
    </>
  );
}
