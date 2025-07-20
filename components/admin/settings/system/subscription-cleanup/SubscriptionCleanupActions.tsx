import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { RotateCcw, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/settings";

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

  const handleTestCleanup = async () => {
    try {
      await onCleanupRequest(true);
    } catch (error) {
      console.error("구독 정리 테스트 실패:", error);
      showError(
        "정리 테스트 실패",
        "구독 정리 테스트 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  const handleRealCleanup = async () => {
    try {
      await onCleanupRequest(false);
    } catch (error) {
      console.error("구독 정리 실패:", error);
      showError(
        "구독 정리 실패",
        "구독 정리 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleTestCleanup}
        disabled={isLoading}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {BUTTONS.SUBSCRIPTION_CLEANUP_TEST_BUTTON}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex-1" disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            {BUTTONS.SUBSCRIPTION_CLEANUP_BUTTON}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {PAGE_HEADER.SUBSCRIPTION_CLEANUP_CONFIRM_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  {PAGE_HEADER.SUBSCRIPTION_CLEANUP_CONFIRM_DESC}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <div className="font-medium mb-1">
                        {LABELS.SUBSCRIPTION_CLEANUP_CONDITIONS_TITLE}
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          {LABELS.SUBSCRIPTION_CLEANUP_FAIL_COUNT.replace(
                            "{count}",
                            (
                              settings.subscriptionFailCountThreshold || 5
                            ).toString()
                          )}
                        </li>
                        <li>
                          {LABELS.SUBSCRIPTION_CLEANUP_INACTIVE.replace(
                            "{status}",
                            settings.subscriptionCleanupInactive
                              ? LABELS.SUBSCRIPTION_CLEANUP_CLEAN
                              : LABELS.SUBSCRIPTION_CLEANUP_MAINTAIN
                          )}
                        </li>
                        <li>
                          {LABELS.SUBSCRIPTION_CLEANUP_FORCE_DELETE.replace(
                            "{status}",
                            settings.subscriptionForceDelete
                              ? LABELS.SUBSCRIPTION_CLEANUP_ENABLED
                              : LABELS.SUBSCRIPTION_CLEANUP_DISABLED
                          )}
                        </li>
                        <li>
                          {LABELS.SUBSCRIPTION_CLEANUP_AUTO_DELETE.replace(
                            "{days}",
                            (settings.subscriptionCleanupDays || 30).toString()
                          )}
                        </li>
                        <li>{LABELS.SUBSCRIPTION_CLEANUP_IRRECOVERABLE}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {BUTTONS.CLEANUP_CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRealCleanup}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {BUTTONS.CLEANUP_CLEANING}
                </>
              ) : (
                BUTTONS.CLEANUP_DELETE
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
