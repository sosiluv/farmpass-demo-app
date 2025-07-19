import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import type { SystemSettings } from "@/lib/types/settings";

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
  const { toast } = useToast();

  const handleTestCleanup = async () => {
    try {
      await onCleanupRequest(true);
    } catch (error) {
      console.error("구독 정리 테스트 실패:", error);
      toast({
        title: "정리 테스트 실패",
        description:
          "구독 정리 테스트 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleRealCleanup = async () => {
    try {
      await onCleanupRequest(false);
    } catch (error) {
      console.error("구독 정리 실패:", error);
      toast({
        title: "구독 정리 실패",
        description: "구독 정리 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
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
        정리 테스트
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex-1" disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            구독 정리
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>구독 정리 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="text-sm mb-3">
                  현재 설정에 따라 구독이 정리됩니다.
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <div className="font-medium mb-1">정리 조건:</div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          실패 횟수:{" "}
                          {settings.subscriptionFailCountThreshold || 5}회 이상
                        </li>
                        <li>
                          비활성 구독:{" "}
                          {settings.subscriptionCleanupInactive
                            ? "정리"
                            : "유지"}
                        </li>
                        <li>
                          강제 삭제:{" "}
                          {settings.subscriptionForceDelete
                            ? "활성화"
                            : "비활성화"}
                        </li>
                        <li>
                          자동 삭제: {settings.subscriptionCleanupDays || 30}일
                          후
                        </li>
                        <li>정리된 구독은 복구할 수 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRealCleanup}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  정리 중...
                </>
              ) : (
                "정리"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
