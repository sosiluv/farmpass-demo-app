import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useDeleteLogsMutation } from "@/lib/hooks/query/use-logs-mutations";
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
  const { showInfo, showWarning, showSuccess, showError } = useCommonToast();
  const deleteLogsMutation = useDeleteLogsMutation();

  // 로그 삭제 처리
  const handleDeleteLog = async (id: string) => {
    showInfo("로그 삭제 시작", "로그를 삭제하는 중입니다...");

    deleteLogsMutation.mutate(
      { action: "delete_single", logId: id },
      {
        onSuccess: () => {
          setLogs((prevLogs: SystemLog[]) =>
            prevLogs.filter((log: SystemLog) => log.id !== id)
          );
          showSuccess("로그 삭제 완료", "로그가 삭제되었습니다.");
        },
        onError: (error) => {
          showError(
            "로그 삭제 실패",
            error.message || "로그 삭제 중 오류가 발생했습니다."
          );
        },
      }
    );
  };

  // 전체 로그 삭제 처리
  const handleDeleteAllLogs = async () => {
    if (logs.length === 0) {
      showWarning("삭제할 로그 없음", "삭제할 로그가 없습니다.");
      return;
    }

    showInfo("전체 로그 삭제 시작", "모든 로그를 삭제하는 중입니다...");

    deleteLogsMutation.mutate(
      { action: "delete_all" },
      {
        onSuccess: () => {
          setLogs([]);
          showSuccess("전체 로그 삭제 완료", "모든 로그가 삭제되었습니다.");
        },
        onError: (error) => {
          showError(
            "전체 로그 삭제 실패",
            error.message || "전체 로그 삭제 중 오류가 발생했습니다."
          );
        },
      }
    );
  };

  // 30일 이전 로그 삭제 처리
  const handleDeleteOldLogs = async () => {
    showInfo(
      "30일 이전 로그 삭제 시작",
      "30일 이전 로그를 삭제하는 중입니다..."
    );

    deleteLogsMutation.mutate(
      { action: "delete_old" },
      {
        onSuccess: (result) => {
          showSuccess(
            "오래된 로그 삭제 완료",
            `${result.deletedCount || 0}개의 오래된 로그가 삭제되었습니다.`
          );
        },
        onError: (error) => {
          showError(
            "오래된 로그 삭제 실패",
            error.message || "오래된 로그 삭제 중 오류가 발생했습니다."
          );
        },
      }
    );
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
