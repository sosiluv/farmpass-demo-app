import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { farmFormSchema, type FarmFormValues } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Farm } from "@/lib/hooks/use-farms";
import type { FarmType } from "@/lib/constants/farm-types";
import {
  FarmFormDialogHeader,
  FarmFormBasicFields,
  FarmFormAddressField,
  FarmFormManagerFields,
} from "./components";
import React from "react";

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
          농장 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <FarmFormDialogHeader editingFarm={editingFarm} />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FarmFormBasicFields form={form} />
            <FarmFormAddressField form={form} />
            <FarmFormManagerFields form={form} />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting || isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting || isLoading}>
                {(submitting || isLoading) && (
                  <svg
                    className="animate-spin mr-2 h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-25"
                    />
                    <path
                      d="M15 8a7 7 0 11-7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-75"
                    />
                  </svg>
                )}
                {editingFarm ? "수정" : "등록"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
