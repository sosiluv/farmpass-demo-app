import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import React from "react";
import { BUTTONS, PAGE_HEADER } from "@/lib/constants/farms";

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
  const [submitting, setSubmitting] = React.useState(false);

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
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={() => onOpenChange(false)}
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
        />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-3 sm:space-y-6"
          >
            <FarmFormBasicFields form={form} />
            <FarmFormAddressField form={form} />
            <FarmFormManagerFields form={form} />

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
          </form>
        </Form>
      </CommonSheetContent>
    </Sheet>
  );
}
