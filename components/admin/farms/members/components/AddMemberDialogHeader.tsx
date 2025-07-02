import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AddMemberDialogHeader() {
  return (
    <DialogHeader className="space-y-2">
      <DialogTitle className="text-base sm:text-lg">구성원 추가</DialogTitle>
      <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
        추가할 구성원의 이메일과 권한을 입력하세요.
      </DialogDescription>
    </DialogHeader>
  );
}
