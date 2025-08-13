import { useState } from "react";
import { MoreHorizontal, Pencil, Trash, Loader2 } from "lucide-react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { VisitorFormSheet } from "../VisitorFormSheet";
import { VisitorWithFarm } from "@/lib/types/visitor";
import { BUTTONS, PAGE_HEADER } from "@/lib/constants/visitor";
import { DeleteConfirmSheet } from "@/components/ui/confirm-sheet";
import type { VisitorSheetFormData } from "@/lib/utils/validation/visitor-validation";

interface VisitorActionMenuProps {
  visitor: VisitorWithFarm;
  onEdit?: (visitor: VisitorSheetFormData) => Promise<void>;
  onDelete?: (visitorId: string, farmId: string) => Promise<void>;
  onSuccess?: () => void;
}

export function VisitorActionMenu({
  visitor,
  onEdit,
  onDelete,
  onSuccess,
}: VisitorActionMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    if (isProcessing || !onDelete) return;

    try {
      setIsProcessing(true);
      await onDelete(visitor.id, visitor.farm_id);
      setShowDeleteDialog(false);
      onSuccess?.();
    } catch (error) {
      devLog.error("Error in handleDelete:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (values: VisitorSheetFormData) => {
    if (isProcessing || !onEdit) return;

    try {
      setIsProcessing(true);
      await onEdit(values);

      setShowEditDialog(false);
      onSuccess?.();
    } catch (error) {
      devLog.error("방문자 수정 실패:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (!isProcessing) {
      setIsDropdownOpen(open);
    }
  };

  const handleEditClick = () => {
    if (!isProcessing) {
      setShowEditDialog(true);
      setIsDropdownOpen(false);
    }
  };

  const handleDeleteClick = () => {
    if (!isProcessing) {
      setShowDeleteDialog(true);
      setIsDropdownOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={handleDropdownOpenChange}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-600"
            disabled={isProcessing}
          >
            <span className="sr-only">{BUTTONS.VISITOR_ACTION_MENU_OPEN}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditClick} disabled={isProcessing}>
            <Pencil className="mr-2 h-4 w-4" />
            {BUTTONS.VISITOR_ACTION_MENU_EDIT}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="text-destructive"
            disabled={isProcessing}
          >
            <Trash className="mr-2 h-4 w-4" />
            {BUTTONS.VISITOR_ACTION_MENU_DELETE}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmSheet
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={isProcessing}
        title={PAGE_HEADER.VISITOR_ACTION_MENU_DELETE_TITLE}
        description={PAGE_HEADER.VISITOR_ACTION_MENU_DELETE_DESC.replace(
          "{name}",
          visitor.visitor_name
        )}
        itemName={visitor.visitor_name}
      />

      <VisitorFormSheet
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mode="edit"
        initialData={visitor}
        farmId={visitor.farm_id}
        onSuccess={handleUpdate}
        isLoading={false} // 이미 로드된 데이터를 사용하므로 false
      />
    </>
  );
}
