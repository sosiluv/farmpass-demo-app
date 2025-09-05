import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useCallback } from "react";
import { farmFormSchema, type FarmFormValues } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
  CommonSheetFooter,
} from "@/components/ui/sheet-common";
import { Plus, Loader2, Edit } from "lucide-react";
import type { Farm } from "@/lib/types/common";
import type { FarmType } from "@/lib/constants/farm-types";
import {
  FarmFormBasicFields,
  FarmFormAddressField,
  FarmFormManagerFields,
} from "./components";
import { BUTTONS, PAGE_HEADER, LABELS } from "@/lib/constants/farms";
import { ScrollArea } from "@/components/ui/scroll-area";
import useBlockNavigation from "@/hooks/ui/use-before-unload";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";

interface FarmFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFarm: Farm | null;
  onSubmit: (values: FarmFormValues) => Promise<void>;
  onAddClick: () => void;
  isLoading?: boolean;
}

export function FarmFormSheet({
  open,
  onOpenChange,
  editingFarm,
  onSubmit,
  onAddClick,
  isLoading = false,
}: FarmFormSheetProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  // 폼 초기화
  const form = useForm<FarmFormValues>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: {
      farm_name: "",
      farm_address: "",
      farm_detailed_address: "",
      farm_type: undefined,
      description: "",
      manager_name: "",
      manager_phone: "",
    },
  });

  const handleSheetClose = useCallback(() => {
    setShowConfirmSheet(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // 뒤로가기 처리 - useBlockNavigation 훅 사용
  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } =
    useBlockNavigation(open, false, showConfirmSheet, handleSheetClose);

  // confirm 다이얼로그 처리
  useEffect(() => {
    if (isAttemptingNavigation) {
      setShowConfirmSheet(true);
    }
  }, [isAttemptingNavigation]);

  // editingFarm이 변경될 때 폼 값 업데이트
  useEffect(() => {
    if (editingFarm) {
      form.reset({
        farm_name: editingFarm.farm_name,
        farm_address: editingFarm.farm_address,
        farm_detailed_address: editingFarm.farm_detailed_address || "",
        farm_type: (editingFarm.farm_type as FarmType) || undefined,
        description: editingFarm.description || "",
        manager_name: editingFarm.manager_name || "",
        manager_phone: editingFarm.manager_phone || "",
      });
    } else {
      form.reset({
        farm_name: "",
        farm_address: "",
        farm_detailed_address: "",
        farm_type: undefined,
        description: "",
        manager_name: "",
        manager_phone: "",
      });
    }
  }, [editingFarm, form]);

  const handleSubmit = async (values: FarmFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            onClick={onAddClick}
            disabled={submitting || isLoading}
            className="text-sm sm:text-base"
          >
            <Plus className="mr-2 h-4 w-4" />
            {BUTTONS.ADD_FARM_BUTTON}
          </Button>
        </SheetTrigger>
        <CommonSheetContent
          side="bottom"
          enableDragToResize={true}
          onClose={() => onOpenChange(false)}
          open={open}
        >
          <CommonSheetHeader
            title={
              editingFarm
                ? PAGE_HEADER.EDIT_FARM_TITLE
                : PAGE_HEADER.ADD_FARM_TITLE
            }
            description={
              editingFarm
                ? PAGE_HEADER.EDIT_FARM_DESCRIPTION
                : PAGE_HEADER.ADD_FARM_DESCRIPTION
            }
            show={false}
          />
          <ScrollArea className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-2 sm:space-y-4 p-3">
                  <div className="grid gap-3 sm:gap-6 md:grid-cols-2 md:gap-4">
                    <FarmFormBasicFields form={form} />
                    <FarmFormAddressField form={form} />
                    <FarmFormManagerFields form={form} />
                  </div>
                </div>
              </form>
            </Form>
          </ScrollArea>

          <CommonSheetFooter
            onCancel={() => onOpenChange(false)}
            onConfirm={form.handleSubmit(handleSubmit)}
            cancelText={BUTTONS.CANCEL_BUTTON}
            confirmText={
              editingFarm ? BUTTONS.EDIT_BUTTON : BUTTONS.REGISTER_BUTTON
            }
            isLoading={submitting || isLoading}
            disabled={submitting || isLoading}
            confirmIcon={
              submitting || isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : editingFarm ? (
                <Edit className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )
            }
          />
        </CommonSheetContent>
      </Sheet>

      {/* 네비게이션 확인 시트 */}
      <ConfirmSheet
        open={showConfirmSheet}
        onOpenChange={setShowConfirmSheet}
        onConfirm={() => {
          proceedNavigation();
        }}
        onCancel={() => {
          setShowConfirmSheet(false);
          cancelNavigation();
        }}
        title={LABELS.FARM_FORM_CANCEL_TITLE}
        warningMessage={LABELS.FARM_FORM_CANCEL_DESCRIPTION}
        variant="warning"
      />
    </>
  );
}
