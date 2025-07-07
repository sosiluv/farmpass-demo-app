import { useState } from "react";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { VisitorFormDialog, VisitorFormValues } from "../VisitorFormDialog";
import { VisitorWithFarm } from "@/lib/types/visitor";

interface VisitorActionMenuProps {
  visitor: VisitorWithFarm;
  onEdit?: (visitor: VisitorWithFarm) => Promise<void>;
  onDelete?: (visitor: VisitorWithFarm) => Promise<void>;
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
      await onDelete(visitor);
      setShowDeleteDialog(false);
      onSuccess?.();
    } catch (error) {
      devLog.error("Error in handleDelete:", error);
      // ?�스?�는 hook?�서 처리??
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (values: VisitorFormValues) => {
    if (isProcessing || !onEdit) return;

    try {
      setIsProcessing(true);
      await onEdit({
        ...visitor,
        ...values,
      });

      setShowEditDialog(false);
      onSuccess?.();
    } catch (error) {
      devLog.error("방문???�정 ?�패:", error);
      // ?�스?�는 hook?�서 처리??
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
            className="h-8 w-8 p-0 dark:text-white !important dark:disabled:text-slate-600"
            style={{ color: "#fff" }}
            disabled={isProcessing}
          >
            <span className="sr-only">메뉴 ?�기</span>
            <MoreHorizontal
              className="h-4 w-4 dark:text-white !important dark:disabled:text-slate-600"
              style={{ color: "#fff" }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEditClick} disabled={isProcessing}>
            <Pencil className="mr-2 h-4 w-4" />
            ?�정
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="text-destructive"
            disabled={isProcessing}
          >
            <Trash className="mr-2 h-4 w-4" />
            ??��
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>방문????��</AlertDialogTitle>
            <AlertDialogDescription>
              {visitor.visitor_name} 방문?�의 ?�보�???��?�시겠습?�까?
              <br />???�업?� ?�돌�????�습?�다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "??�� �?.." : "??��"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VisitorFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mode="edit"
        initialData={visitor}
        farmId={visitor.farm_id}
        onSuccess={handleUpdate}
      />
    </>
  );
}
