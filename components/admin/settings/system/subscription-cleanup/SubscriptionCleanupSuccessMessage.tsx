import type { SubscriptionCleanupResult } from "@/lib/types/notification";

interface SubscriptionCleanupSuccessMessageProps {
  lastCleanupResult: SubscriptionCleanupResult | null;
}

export function SubscriptionCleanupSuccessMessage({
  lastCleanupResult,
}: SubscriptionCleanupSuccessMessageProps) {
  if (!lastCleanupResult) {
    return null;
  }

  const { cleanedCount, validCount, totalChecked, stats } = lastCleanupResult;

  if (cleanedCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-700 font-medium">
            ✅ 모든 구독이 유효합니다
          </p>
        </div>
        <p className="text-xs text-green-600 mt-1">
          현재 정리할 구독이 없습니다. 총 {totalChecked}개의 구독이 모두 정상
          상태입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        <p className="text-sm text-green-700 font-medium">
          🎉 구독 정리가 완료되었습니다!
        </p>
      </div>
      <div className="text-xs text-green-600 mt-2 space-y-1">
        <p>총 {cleanedCount}개의 구독이 정리되었습니다.</p>
        <div className="bg-green-100 rounded p-2 mt-2">
          <p className="font-medium mb-1">정리 상세:</p>
          <ul className="space-y-0.5 text-xs">
            {stats.failCountCleaned > 0 && (
              <li>• 실패 횟수 초과: {stats.failCountCleaned}개</li>
            )}
            {stats.inactiveCleaned > 0 && (
              <li>• 비활성 구독: {stats.inactiveCleaned}개</li>
            )}
            {stats.expiredCleaned > 0 && (
              <li>• 만료된 구독: {stats.expiredCleaned}개</li>
            )}
            {stats.forceDeleted > 0 && (
              <li>• 강제 삭제: {stats.forceDeleted}개</li>
            )}
            {stats.oldSoftDeletedCleaned > 0 && (
              <li>• 오래된 Soft Delete: {stats.oldSoftDeletedCleaned}개</li>
            )}
          </ul>
          <p className="mt-1 text-xs opacity-75">
            유효한 구독: {validCount}개 / 총 검사: {totalChecked}개
          </p>
        </div>
      </div>
    </div>
  );
}
