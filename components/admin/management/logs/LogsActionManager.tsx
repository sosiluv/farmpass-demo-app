import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/api-client";
import { handleError } from "@/lib/utils/handleError";
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
  const { showSuccess, showError, showInfo, showWarning } = useCommonToast();

  // 로그 삭제 처리
  const handleDeleteLog = async (id: string) => {
    showInfo("로그 삭제 시작", "로그를 삭제하는 중입니다...");
    try {
      await apiClient("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_single",
          logId: id,
        }),
        context: "로그 삭제",
        onError: (error, context) => {
          handleError(error, context);
          showError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
        },
      });
      setLogs((prevLogs: SystemLog[]) =>
        prevLogs.filter((log: SystemLog) => log.id !== id)
      );
      showSuccess("로그 삭제 완료", "로그가 삭제되었습니다.");
    } catch {
      // onError에서 이미 처리함
    }
  };

  // 전체 로그 삭제 처리
  const handleDeleteAllLogs = async () => {
    if (logs.length === 0) {
      showWarning("삭제할 로그 없음", "삭제할 로그가 없습니다.");
      return;
    }
    showInfo("전체 로그 삭제 시작", "모든 로그를 삭제하는 중입니다...");
    try {
      const beforeCount = logs.length;
      await apiClient("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_all",
          beforeCount,
        }),
        context: "전체 로그 삭제",
        onError: (error, context) => {
          handleError(error, context);
          showError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
        },
      });
      setLogs([]);
      showSuccess(
        "로그 삭제 완료",
        `모든 로그가 삭제되었습니다. (총 ${beforeCount}개)`
      );
    } catch {
      // onError에서 이미 처리함
    }
  };

  // 30일 이전 로그 삭제 처리
  const handleDeleteOldLogs = async () => {
    showInfo(
      "30일 이전 로그 삭제 시작",
      "30일 이전 로그를 삭제하는 중입니다..."
    );
    try {
      const result = await apiClient("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_old",
        }),
        context: "30일 이전 로그 삭제",
        onError: (error, context) => {
          handleError(error, context);
          showError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
        },
      });
      if (result.result.deleted) {
        showSuccess(
          "로그 삭제 완료",
          `30일 이전 로그가 삭제되었습니다. (총 ${result.result.count}개)`
        );
      } else {
        showSuccess("로그 삭제 완료", "삭제할 30일 이전 로그가 없습니다.");
      }
    } catch {
      // onError에서 이미 처리함
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
