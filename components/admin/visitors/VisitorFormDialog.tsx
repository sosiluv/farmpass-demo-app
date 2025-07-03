import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressSearch } from "@/components/common/address-search";

export interface VisitorFormValues {
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_detailed_address?: string;
  visitor_purpose: string | null;
  vehicle_number: string | null;
  notes: string | null;
  disinfection_check: boolean;
}

interface VisitorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: VisitorFormValues & { id: string; farm_id: string };
  farmId: string;
  onSuccess: (values: VisitorFormValues) => Promise<void>;
}

const visitorFormSchema = z.object({
  visitor_name: z.string().min(1, "이름을 입력해주세요."),
  visitor_phone: z.string().min(1, "연락처를 입력해주세요."),
  visitor_address: z.string().min(1, "주소를 입력해주세요."),
  visitor_detailed_address: z.string().optional(),
  visitor_purpose: z.string().nullable(),
  vehicle_number: z.string().nullable(),
  notes: z.string().nullable(),
  disinfection_check: z.boolean(),
});

export function VisitorFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
  farmId,
  onSuccess,
}: VisitorFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showCustomError } = useCommonToast();

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      visitor_name: "",
      visitor_phone: "",
      visitor_address: "",
      visitor_detailed_address: "",
      visitor_purpose: null,
      vehicle_number: null,
      notes: null,
      disinfection_check: false,
    },
  });

  // 폼 초기화 - open 상태와 initialData가 변경될 때만 실행
  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      form.reset({
        visitor_name: initialData.visitor_name || "",
        visitor_phone: initialData.visitor_phone || "",
        visitor_address: initialData.visitor_address || "",
        visitor_detailed_address: initialData.visitor_detailed_address || "",
        visitor_purpose: initialData.visitor_purpose,
        vehicle_number: initialData.vehicle_number,
        notes: initialData.notes,
        disinfection_check: initialData.disinfection_check || false,
      });
    } else if (open && mode === "create") {
      form.reset({
        visitor_name: "",
        visitor_phone: "",
        visitor_address: "",
        visitor_detailed_address: "",
        visitor_purpose: null,
        vehicle_number: null,
        notes: null,
        disinfection_check: false,
      });
    }
  }, [open, mode, initialData, form]);

  const onSubmit = async (values: VisitorFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSuccess({
        ...values,
        visitor_purpose: values.visitor_purpose || null,
        vehicle_number: values.vehicle_number || null,
        notes: values.notes || null,
      });

      onOpenChange(false);
    } catch (error) {
      devLog.error("폼 제출 실패:", error);
      showCustomError(
        "폼 제출 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  }, [isSubmitting, onOpenChange, form]);

  // 입력 필드 렌더링 함수
  const renderField = useCallback(
    (
      name: keyof Omit<
        VisitorFormValues,
        "disinfection_check" | "visitor_detailed_address"
      >,
      label: string,
      type: "input" | "textarea" = "input",
      required = false
    ) => (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && " *"}
            </FormLabel>
            <FormControl>
              {type === "input" ? (
                <Input
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                />
              ) : (
                <Textarea
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    [form.control, isSubmitting]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "방문자 등록" : "방문자 정보 수정"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "새로운 방문자를 등록합니다."
              : "방문자 정보를 수정합니다."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {renderField("visitor_name", "이름", "input", true)}
            {renderField("visitor_phone", "연락처", "input", true)}

            {/* 주소 필드 */}
            <FormField
              control={form.control}
              name="visitor_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주소 *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <AddressSearch
                        onSelect={(address, detailedAddress) => {
                          field.onChange(address);
                          form.setValue(
                            "visitor_detailed_address",
                            detailedAddress
                          );
                        }}
                        defaultDetailedAddress={
                          form.getValues("visitor_detailed_address") || ""
                        }
                      />
                      <div className="space-y-2">
                        <Textarea
                          placeholder="주소 검색 버튼을 클릭하여 주소를 입력하세요"
                          {...field}
                          readOnly
                        />
                        <FormField
                          control={form.control}
                          name="visitor_detailed_address"
                          render={({ field: detailField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="상세 주소를 입력하세요 (예: 101동 1234호)"
                                  {...detailField}
                                  value={detailField.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderField("visitor_purpose", "방문 목적", "input", true)}
            {renderField("vehicle_number", "차량 번호")}
            {renderField("notes", "비고", "textarea")}

            <FormField
              control={form.control}
              name="disinfection_check"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">소독 여부</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
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
                {mode === "create" ? "등록" : "수정"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
