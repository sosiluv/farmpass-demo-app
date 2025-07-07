import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";

import {
  visitorDialogFormSchema,
  type VisitorDialogFormData,
} from "@/lib/utils/validation/visitor-validation";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressSearch } from "@/components/common/address-search";

// VisitorDialogFormData 타입 사용
export interface VisitorFormValues extends VisitorDialogFormData {}

interface VisitorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: VisitorFormValues & { id: string; farm_id: string };
  farmId: string;
  onSuccess: (values: VisitorFormValues) => Promise<void>;
}

// 방문 목적 옵션 직접 선언
const VISIT_PURPOSE_OPTIONS = [
  "납품",
  "점검",
  "미팅",
  "수의사 진료",
  "사료 배송",
  "방역",
  "견학",
  "기타",
];

export function VisitorFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
  farmId,
  onSuccess,
}: VisitorFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showInfo, showError } = useCommonToast();

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorDialogFormSchema),
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
  }, [open, mode, initialData]); // form을 의존성에서 제거

  const onSubmit = async (values: VisitorFormValues) => {
    if (isSubmitting) return;

    showInfo("폼 제출 시작", "방문자 정보를 저장하는 중입니다...");
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
      showError(
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
            {renderField("visitor_name", "성명", "input", true)}
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

            {/* 방문목적 필드 */}
            <FormField
              control={form.control}
              name="visitor_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>방문목적 *</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="방문 목적을 선택하세요." />
                      </SelectTrigger>
                      <SelectContent>
                        {(VISIT_PURPOSE_OPTIONS || []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderField("vehicle_number", "차량번호")}
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
                  <FormLabel className="font-normal">소독여부</FormLabel>
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
