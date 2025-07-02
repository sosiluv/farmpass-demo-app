interface CleanupSuccessMessageProps {
  lastCleanupSuccess: string | null;
  cleanupStatus: {
    expiredData: {
      systemLogs: { count: number };
      visitorEntries: { count: number };
    };
  };
}

export function CleanupSuccessMessage({
  lastCleanupSuccess,
  cleanupStatus,
}: CleanupSuccessMessageProps) {
  if (lastCleanupSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-green-700 font-medium">
            🎉 {lastCleanupSuccess} 정리가 완료되었습니다!
          </p>
        </div>
        <p className="text-xs text-green-600 mt-1">
          데이터가 성공적으로 정리되었고 상태가 업데이트되었습니다.
        </p>
      </div>
    );
  }

  if (
    !lastCleanupSuccess &&
    cleanupStatus.expiredData.systemLogs.count === 0 &&
    cleanupStatus.expiredData.visitorEntries.count === 0
  ) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-700 font-medium">
            ✅ 모든 데이터가 정리되었습니다
          </p>
        </div>
        <p className="text-xs text-green-600 mt-1">
          현재 정리할 만료된 데이터가 없습니다. 시간이 지나면 새로운 만료
          데이터가 생성됩니다.
        </p>
      </div>
    );
  }

  return null;
}
