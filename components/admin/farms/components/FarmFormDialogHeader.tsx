import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Farm } from "@/lib/types/farm";
import { PAGE_HEADER } from "@/lib/constants/farms";

interface FarmFormDialogHeaderProps {
  editingFarm: Farm | null;
}

export function FarmFormDialogHeader({
  editingFarm,
}: FarmFormDialogHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>
        {editingFarm ? PAGE_HEADER.EDIT_FARM_TITLE : PAGE_HEADER.ADD_FARM_TITLE}
      </DialogTitle>
      <DialogDescription>
        {editingFarm
          ? PAGE_HEADER.EDIT_FARM_DESCRIPTION
          : PAGE_HEADER.ADD_FARM_DESCRIPTION}
      </DialogDescription>
    </DialogHeader>
  );
}
