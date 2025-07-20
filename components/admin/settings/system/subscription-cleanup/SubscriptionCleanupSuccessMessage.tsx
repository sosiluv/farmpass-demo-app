import type { SubscriptionCleanupResult } from "@/lib/types/notification";
import { LABELS } from "@/lib/constants/settings";

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
            {LABELS.SUBSCRIPTION_CLEANUP_ALL_VALID_TITLE}
          </p>
        </div>
        <p className="text-xs text-green-600 mt-1">
          {LABELS.SUBSCRIPTION_CLEANUP_ALL_VALID_DESC.replace(
            "{count}",
            totalChecked.toString()
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        <p className="text-sm text-green-700 font-medium">
          {LABELS.SUBSCRIPTION_CLEANUP_SUCCESS_TITLE}
        </p>
      </div>
      <div className="text-xs text-green-600 mt-2 space-y-1">
        <p>
          {LABELS.SUBSCRIPTION_CLEANUP_SUCCESS_DESC.replace(
            "{count}",
            cleanedCount.toString()
          )}
        </p>
        <div className="bg-green-100 rounded p-2 mt-2">
          <p className="font-medium mb-1">
            {LABELS.SUBSCRIPTION_CLEANUP_DETAILS_TITLE}
          </p>
          <ul className="space-y-0.5 text-xs">
            {stats.failCountCleaned > 0 && (
              <li>
                {LABELS.SUBSCRIPTION_CLEANUP_FAIL_COUNT_CLEANED.replace(
                  "{count}",
                  stats.failCountCleaned.toString()
                )}
              </li>
            )}
            {stats.inactiveCleaned > 0 && (
              <li>
                {LABELS.SUBSCRIPTION_CLEANUP_INACTIVE_CLEANED.replace(
                  "{count}",
                  stats.inactiveCleaned.toString()
                )}
              </li>
            )}
            {stats.expiredCleaned > 0 && (
              <li>
                {LABELS.SUBSCRIPTION_CLEANUP_EXPIRED_CLEANED.replace(
                  "{count}",
                  stats.expiredCleaned.toString()
                )}
              </li>
            )}
            {stats.forceDeleted > 0 && (
              <li>
                {LABELS.SUBSCRIPTION_CLEANUP_FORCE_DELETED.replace(
                  "{count}",
                  stats.forceDeleted.toString()
                )}
              </li>
            )}
            {stats.oldSoftDeletedCleaned > 0 && (
              <li>
                {LABELS.SUBSCRIPTION_CLEANUP_OLD_SOFT_DELETED.replace(
                  "{count}",
                  stats.oldSoftDeletedCleaned.toString()
                )}
              </li>
            )}
          </ul>
          <p className="mt-1 text-xs opacity-75">
            {LABELS.SUBSCRIPTION_CLEANUP_SUMMARY.replace(
              "{valid}",
              validCount.toString()
            ).replace("{total}", totalChecked.toString())}
          </p>
        </div>
      </div>
    </div>
  );
}
