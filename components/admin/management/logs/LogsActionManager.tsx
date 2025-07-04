import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
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
      const response = await fetch("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_single",
          logId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "로그 삭제에 실패했습니다.");
      }

      const result = await response.json();

      // 로컬 상태 업데이트
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

      const response = await fetch("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_all",
          beforeCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "전체 로그 삭제에 실패했습니다.");
      }

      const result = await response.json();

      // 로컬 상태 업데이트 - 모든 로그 제거
      setLogs([]);

      showCustomSuccess(
        "로그 삭제 완료",
        `모든 로그가 삭제되었습니다. (총 ${beforeCount}개)`
      );
    } catch (err) {
      devLog.error("Error deleting all logs:", err);
      showCustomError("로그 삭제 실패", "로그 삭제 중 오류가 발생했습니다.");
    }
  };

  // 30일 이전 로그 삭제 처리
  const handleDeleteOldLogs = async () => {
    try {
      const response = await fetch("/api/admin/logs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_old",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "30일 이전 로그 삭제에 실패했습니다."
        );
      }

      const result = await response.json();

      if (result.result.deleted) {
        // 삭제된 로그 개수만큼 로컬 상태에서 제거 (정확한 개수는 서버에서 계산)
        // 실제로는 페이지를 새로고침하거나 로그를 다시 불러오는 것이 좋음
        showCustomSuccess(
          "로그 삭제 완료",
          `30일 이전 로그가 삭제되었습니다. (총 ${result.result.count}개)`
        );
      } else {
        showCustomSuccess(
          "로그 삭제 완료",
          "삭제할 30일 이전 로그가 없습니다."
        );
      }
    } catch (err) {
      devLog.error("Error deleting old logs:", err);
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
