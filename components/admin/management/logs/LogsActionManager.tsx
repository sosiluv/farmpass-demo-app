import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import type { SystemLog } from "@/lib/types/system";

interface LogsActionManagerProps {
  logs: SystemLog[];
  setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  children: (actions: {
    handleDeleteLog: (id: string) => Promise<void>;
    handleDeleteAllLogs: () => Promise<void>;
    handleDeleteOldLogs: () => Promise<void>;
  }) => React.ReactNode;
}

export function LogsActionManager({
  logs,
  setLogs,
  children,
}: LogsActionManagerProps) {
  const { showCustomSuccess, showCustomError } = useCommonToast();

  // 로그 삭제 처리
  const handleDeleteLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from("system_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLogs((prevLogs: SystemLog[]) =>
        prevLogs.filter((log: SystemLog) => log.id !== id)
      );
      showCustomSuccess("로그 삭제 완료", "로그가 삭제되었습니다.");
    } catch (err) {
      showCustomError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
      devLog.error("Error deleting log:", err);
    }
  };

  // 전체 로그 삭제 처리
  const handleDeleteAllLogs = async () => {
    try {
      const beforeCount = logs.length;

      // 먼저 로그를 삭제
      const { error: deleteError } = await supabase
        .from("system_logs")
        .delete()
        .not("id", "is", null);

      if (deleteError) throw deleteError;

      // 삭제 후 로그 기록
      await createSystemLog(
        "LOG_CLEANUP",
        `관리자가 모든 시스템 로그를 완전히 삭제했습니다 (${beforeCount}개 삭제)`,
        "info",
        undefined,
        "system",
        undefined,
        {
          action: "delete_all_logs",
          deleted_count: beforeCount,
          remaining_count: 1,
          timestamp: new Date().toISOString(),
        }
      );

      const { data: newLogs, error: fetchError } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setLogs(newLogs || []);

      showCustomSuccess(`모든 로그가 삭제되었습니다. (총 ${beforeCount}개)`);
    } catch (err) {
      devLog.error("Error deleting all logs:", err);

      // 로그 삭제 실패 로그 기록
      await createSystemLog(
        "LOG_CLEANUP_ERROR",
        "전체 시스템 로그 삭제 실패",
        "error",
        undefined,
        "system",
        undefined,
        {
          action: "delete_all_logs",
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        }
      );

      showCustomError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
    }
  };

  // 30일 이전 로그 삭제 처리
  const handleDeleteOldLogs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: oldLogsCount, error: countError } = await supabase
        .from("system_logs")
        .select("*", { count: "exact", head: true })
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (countError) throw countError;
      if (!oldLogsCount) {
        showCustomSuccess(
          "로그 삭제 완료",
          "삭제할 30일 이전 로그가 없습니다."
        );
        return;
      }

      // 먼저 로그를 삭제
      const { error: deleteError } = await supabase
        .from("system_logs")
        .delete()
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (deleteError) throw deleteError;

      // 삭제 후 로그 기록
      await createSystemLog(
        "LOG_CLEANUP",
        `관리자가 30일 이전 시스템 로그를 삭제했습니다 (${oldLogsCount}개 삭제)`,
        "info",
        undefined,
        "system",
        undefined,
        {
          action: "delete_old_logs",
          deleted_count: oldLogsCount,
          days_threshold: 30,
          deleted_before_date: thirtyDaysAgo.toISOString(),
          timestamp: new Date().toISOString(),
        }
      );

      const { data: newLogs, error: fetchError } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setLogs(newLogs || []);

      showCustomSuccess(
        "로그 삭제 완료",
        `30일 이전 로그가 삭제되었습니다. (총 ${oldLogsCount}개)`
      );
    } catch (err) {
      devLog.error("Error deleting old logs:", err);

      // 로그 삭제 실패 로그 기록
      await createSystemLog(
        "LOG_CLEANUP_ERROR",
        "30일 이전 시스템 로그 삭제 실패",
        "error",
        undefined,
        "system",
        undefined,
        {
          action: "delete_old_logs",
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        }
      );

      showCustomError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      {children({
        handleDeleteLog,
        handleDeleteAllLogs,
        handleDeleteOldLogs,
      })}
    </>
  );
}
