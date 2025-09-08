import { Button } from "@/components/ui/button";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { RotateCcw, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import type { SystemSettings } from "@/lib/types/settings";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";
import { WarningConfirmSheet } from "@/components/ui/confirm-sheet";

interface SubscriptionCleanupActionsProps {
  settings: SystemSettings;
  isLoading: boolean;
  onCleanupRequest: (isTest: boolean) => Promise<void>;
}

export function SubscriptionCleanupActions({
  settings,
  isLoading,
  onCleanupRequest,
}: SubscriptionCleanupActionsProps) {
  const { showError } = useCommonToast();
  const [cleanupOpen, setCleanupOpen] = useState(false);

  const handleTestCleanup = async () => {
    try {
      await onCleanupRequest(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("정리 테스트 실패", errorMessage);
    }
  };

  const handleRealCleanup = useCallback(async () => {
    try {
      await onCleanupRequest(false);
      setCleanupOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("구독 정리 실패", errorMessage);
    }
  }, [onCleanupRequest, showError]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        className="flex-1 text-sm sm:text-base"
        onClick={handleTestCleanup}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {BUTTONS.SUBSCRIPTION_CLEANUP_TEST_BUTTON}
          </>
        ) : (
          <>
            <RotateCcw className="h-4 w-4 mr-2" />
            {BUTTONS.SUBSCRIPTION_CLEANUP_TEST_BUTTON}
          </>
        )}
      </Button>

      <Button
        variant="destructive"
        className="flex-1 text-sm sm:text-base"
        disabled={isLoading}
        onClick={() => setCleanupOpen(true)}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {BUTTONS.SUBSCRIPTION_CLEANUP_BUTTON}
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            {BUTTONS.SUBSCRIPTION_CLEANUP_BUTTON}
          </>
        )}
      </Button>

      {/* 구독 정리 확인 시트 */}
      <WarningConfirmSheet
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        onConfirm={handleRealCleanup}
        isLoading={isLoading}
        title={PAGE_HEADER.SUBSCRIPTION_CLEANUP_CONFIRM_TITLE}
        description={PAGE_HEADER.SUBSCRIPTION_CLEANUP_CONFIRM_DESC}
        warningMessage={`${
          LABELS.SUBSCRIPTION_CLEANUP_CONDITIONS_TITLE
        }\n• ${LABELS.SUBSCRIPTION_CLEANUP_FAIL_COUNT.replace(
          "{count}",
          (settings.subscriptionFailCountThreshold || 5).toString()
        )}\n• ${LABELS.SUBSCRIPTION_CLEANUP_INACTIVE.replace(
          "{status}",
          settings.subscriptionCleanupInactive
            ? LABELS.SUBSCRIPTION_CLEANUP_CLEAN
            : LABELS.SUBSCRIPTION_CLEANUP_MAINTAIN
        )}\n• ${LABELS.SUBSCRIPTION_CLEANUP_FORCE_DELETE.replace(
          "{status}",
          settings.subscriptionForceDelete
            ? LABELS.SUBSCRIPTION_CLEANUP_ENABLED
            : LABELS.SUBSCRIPTION_CLEANUP_DISABLED
        )}\n• ${LABELS.SUBSCRIPTION_CLEANUP_AUTO_DELETE.replace(
          "{days}",
          (settings.subscriptionCleanupDays || 30).toString()
        )}\n• ${LABELS.SUBSCRIPTION_CLEANUP_IRRECOVERABLE}`}
      />
    </div>
  );
}
