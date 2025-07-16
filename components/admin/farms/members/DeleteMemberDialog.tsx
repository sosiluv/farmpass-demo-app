import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteMemberDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[400px] md:max-w-[500px] p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg">
            구성원 제거
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            정말로 이 구성원을 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                제거 중...
              </>
            ) : (
              "제거"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
