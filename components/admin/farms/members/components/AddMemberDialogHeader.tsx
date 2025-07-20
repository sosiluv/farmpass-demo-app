import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAGE_HEADER } from "@/lib/constants/farms";

export function AddMemberDialogHeader() {
  return (
    <DialogHeader className="space-y-2">
      <DialogTitle className="text-base sm:text-lg">
        {PAGE_HEADER.ADD_MEMBER_TITLE}
      </DialogTitle>
      <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
        {PAGE_HEADER.ADD_MEMBER_DESCRIPTION}
      </DialogDescription>
    </DialogHeader>
  );
}
