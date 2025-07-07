import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Farm } from "@/lib/types/farm";

interface FarmFormDialogHeaderProps {
  editingFarm: Farm | null;
}

export function FarmFormDialogHeader({
  editingFarm,
}: FarmFormDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>{editingFarm ? "농장 수정" : "새 농장 등록"}</DialogTitle>
      <DialogDescription>
        {editingFarm ? "농장 정보를 수정하세요" : "새로운 농장을 등록하세요"}
      </DialogDescription>
    </DialogHeader>
  );
}
