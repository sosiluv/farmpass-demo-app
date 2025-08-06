import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { PAGE_HEADER, BUTTONS, LABELS } from "@/lib/constants/account";
import { useRouter } from "next/navigation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error/";
import AccountCardHeader from "./AccountCardHeader";

export default function WithdrawSection({
  onWithdraw,
}: {
  onWithdraw?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { showSuccess, showError } = useCommonToast();
  const { signOut } = useAuthActions();

  const handleWithdraw = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onWithdraw) {
        await onWithdraw();
      } else {
        const data = await apiClient("/api/auth/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          context: "회원탈퇴",
        });
        showSuccess(
          "회원탈퇴 완료",
          data.message || "회원탈퇴가 완료되었습니다."
        );
        await signOut();
        router.replace("/auth/login");
        return;
      }
      setOpen(false);
    } catch (error) {
      handleError(error, { context: "withdraw" });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("오류", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <AccountCardHeader
        icon={AlertTriangle}
        title={PAGE_HEADER.WITHDRAW_TITLE}
        description={PAGE_HEADER.WITHDRAW_DESCRIPTION}
      />
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={loading}
                className="text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {BUTTONS.WITHDRAW}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {BUTTONS.WITHDRAW}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base sm:text-lg">
                  {LABELS.WITHDRAW_DIALOG_TITLE}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm sm:text-base">
                  {LABELS.WITHDRAW_DIALOG_DESC}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={loading}
                  className="text-sm sm:text-base"
                >
                  {BUTTONS.WITHDRAW_CANCEL}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="bg-destructive text-white hover:bg-destructive/90 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {BUTTONS.WITHDRAWING}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {BUTTONS.WITHDRAW_CONFIRM}
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {error && (
          <div className="text-sm sm:text-base text-red-500">{error}</div>
        )}
      </CardContent>
    </Card>
  );
}
