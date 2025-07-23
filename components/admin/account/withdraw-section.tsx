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
import AccountCardHeader from "./AccountCardHeader";
import { PAGE_HEADER, BUTTONS, LABELS } from "@/lib/constants/account";
import { useRouter } from "next/navigation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error/handleError";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

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
  const { signOut } = useAuth();

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
        router.replace("/login");
        return;
      }
      setOpen(false);
    } catch (error: any) {
      handleError(error, { context: "withdraw" });
      const authError = getAuthErrorMessage(error);
      showError("오류", authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between w-full px-6 pt-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive mr-2" />
          <span className="text-lg font-semibold">
            {PAGE_HEADER.WITHDRAW_TITLE}
          </span>
        </div>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading}>
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
              <AlertDialogTitle>
                {LABELS.WITHDRAW_DIALOG_TITLE}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {LABELS.WITHDRAW_DIALOG_DESC}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>
                {BUTTONS.WITHDRAW_CANCEL}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWithdraw}
                disabled={loading}
                className="bg-destructive text-white hover:bg-destructive/90"
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
      <div className="px-6 pb-4">
        <div className="text-xs text-muted-foreground mb-1">
          {PAGE_HEADER.WITHDRAW_DESCRIPTION}
        </div>
        {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
      </div>
    </Card>
  );
}
