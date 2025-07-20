import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { farmFormSchema, type FarmFormValues } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import type { Farm } from "@/lib/types/farm";
import type { FarmType } from "@/lib/constants/farm-types";
import {
  FarmFormDialogHeader,
  FarmFormBasicFields,
  FarmFormAddressField,
  FarmFormManagerFields,
} from "./components";
import React from "react";
import { BUTTONS, LABELS } from "@/lib/constants/farms";

interface FarmFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFarm: Farm | null;
  onSubmit: (values: FarmFormValues) => Promise<void>;
  onAddClick: () => void;
  isLoading?: boolean;
}

export function FarmFormDialog({
  open,
  onOpenChange,
  editingFarm,
  onSubmit,
  onAddClick,
  isLoading = false,
}: FarmFormDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onAddClick} disabled={submitting || isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          {BUTTONS.ADD_FARM_BUTTON}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <FarmFormDialogHeader editingFarm={editingFarm} />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-3 sm:space-y-6"
          >
            <FarmFormBasicFields form={form} />
            <FarmFormAddressField form={form} />
            <FarmFormManagerFields form={form} />

            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting || isLoading}
                className="h-12 px-6 text-base flex-1 sm:flex-none"
              >
                {BUTTONS.CANCEL_BUTTON}
              </Button>
              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="h-12 px-6 text-base flex-1 sm:flex-none min-w-[100px]"
              >
                {submitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingFarm
                      ? BUTTONS.EDITING_LOADING
                      : BUTTONS.REGISTERING_LOADING}
                  </>
                ) : editingFarm ? (
                  BUTTONS.EDIT_BUTTON
                ) : (
                  BUTTONS.REGISTER_BUTTON
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
