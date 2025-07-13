import { useCallback, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";
import { formatPhone } from "@/lib/utils/validation/validation";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

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

// ===========================================
// 타입 및 상수 정의
// ===========================================

export interface VisitorFormValues extends VisitorDialogFormData {}

interface VisitorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: VisitorFormValues & { id: string; farm_id: string };
  farmId: string;
  onSuccess: (values: VisitorFormValues) => Promise<void>;
  isLoading?: boolean; // 외부 로딩 상태 (예: 편집 데이터 로드)
}

const VISIT_PURPOSE_OPTIONS = [
  "납품",
  "점검",
  "미팅",
  "수의사 진료",
  "사료 배송",
  "방역",
  "견학",
  "기타",
] as const;

const DEFAULT_FORM_VALUES: VisitorFormValues = {
  visitor_name: "",
  visitor_phone: "",
  visitor_address: "",
  visitor_purpose: null,
  vehicle_number: null,
  notes: null,
  disinfection_check: false,
};

// ===========================================
// 메인 컴포넌트
// ===========================================

export function VisitorFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
  farmId,
  onSuccess,
  isLoading = false,
}: VisitorFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError } = useCommonToast();

  // 전체 로딩 상태 (외부 로딩 + 제출 중)
  const isFormDisabled = isLoading || isSubmitting;

  // 폼 초기화 데이터 계산 (깜빡임 방지를 위한 최적화)
  const formInitialValues = useMemo(() => {
    if (mode === "edit" && initialData) {
      return {
        visitor_name: initialData.visitor_name || "",
        visitor_phone: initialData.visitor_phone || "",
        visitor_address: initialData.visitor_address || "",
        visitor_purpose: initialData.visitor_purpose,
        vehicle_number: initialData.vehicle_number,
        notes: initialData.notes,
        disinfection_check: initialData.disinfection_check || false,
      };
    }
    return DEFAULT_FORM_VALUES;
  }, [mode, initialData]);

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(visitorDialogFormSchema),
    values: formInitialValues, // 항상 최신 값으로 동기화 (깜빡임 방지)
  });

  // 다이얼로그 열릴 때만 폼 초기화 (initialData 변경은 values로 자동 처리)
  useEffect(() => {
    if (open && !isLoading) {
      // 로딩이 완료된 후에만 폼 초기화
      form.reset(formInitialValues);
    }
  }, [open, isLoading]); // formInitialValues와 form 의존성 제거로 무한 루프 방지

  // ===========================================
  // 이벤트 핸들러
  // ===========================================

  const handleSubmit = async (values: VisitorFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 성공 토스트를 onSuccess에서 처리하므로 여기서는 로딩 상태만 표시
      await onSuccess({
        ...values,
        visitor_purpose: values.visitor_purpose || null,
        vehicle_number: values.vehicle_number || null,
        notes: values.notes || null,
      });

      // 성공 시 다이얼로그 닫기
      onOpenChange(false);
    } catch (error) {
      devLog.error("폼 제출 실패:", error);
      handleError(error, "방문자 폼 제출");
      const authError = getAuthErrorMessage(error);
      showError("폼 제출 실패", authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isFormDisabled) {
      onOpenChange(false);
    }
  }, [isFormDisabled, onOpenChange]);

  const handlePhoneChange = useCallback(
    (value: string, onChange: (value: string) => void) => {
      const formattedPhone = formatPhone(value);
      onChange(formattedPhone);
    },
    []
  );

  const handleAddressSelect = useCallback(
    (
      address: string,
      detailedAddress: string,
      onChange: (value: string) => void
    ) => {
      const fullAddress =
        address + (detailedAddress ? ` ${detailedAddress}` : "");
      onChange(fullAddress);
    },
    []
  );

  // ===========================================
  // 렌더링 헬퍼
  // ===========================================

  // 렌더링 최적화를 위한 메모화된 컴포넌트
  const renderInputField = useCallback(
    (
      name: keyof Omit<VisitorFormValues, "disinfection_check">,
      label: string,
      required = false,
      type: "input" | "textarea" = "input"
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
                  disabled={isFormDisabled}
                  onChange={(e) => {
                    if (name === "visitor_phone") {
                      handlePhoneChange(e.target.value, field.onChange);
                    } else {
                      field.onChange(e.target.value);
                    }
                  }}
                  maxLength={name === "visitor_phone" ? 13 : undefined}
                  type={name === "visitor_phone" ? "tel" : "text"}
                  placeholder={
                    name === "visitor_phone"
                      ? "숫자만 입력 가능합니다"
                      : name === "visitor_name"
                      ? "홍길동"
                      : name === "vehicle_number"
                      ? "12가3456 (선택사항)"
                      : undefined
                  }
                />
              ) : (
                <Textarea
                  {...field}
                  value={field.value || ""}
                  disabled={isFormDisabled}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={3}
                  placeholder={
                    name === "notes"
                      ? "추가 사항이 있으면 입력해주세요"
                      : undefined
                  }
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    [form.control, isFormDisabled, handlePhoneChange]
  );

  // 메모화된 주소 검색 컴포넌트
  const renderAddressField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="visitor_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>주소 *</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <AddressSearch
                  onSelect={(address, detailedAddress) =>
                    handleAddressSelect(
                      address,
                      detailedAddress,
                      field.onChange
                    )
                  }
                  defaultDetailedAddress=""
                />
                <Textarea
                  placeholder="주소 검색 버튼을 클릭하여 주소를 입력하세요"
                  value={field.value || ""}
                  readOnly
                  disabled={isFormDisabled}
                  rows={2}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    [form.control, isFormDisabled, handleAddressSelect]
  );

  // 메모화된 방문목적 필드
  const renderPurposeField = useCallback(
    () => (
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
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="방문 목적을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_PURPOSE_OPTIONS.map((option) => (
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
    ),
    [form.control, isFormDisabled]
  );

  // 메모화된 소독여부 필드
  const renderDisinfectionField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="disinfection_check"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormLabel className="font-normal">소독여부</FormLabel>
          </FormItem>
        )}
      />
    ),
    [form.control, isFormDisabled]
  );

  // ===========================================
  // 메인 렌더링
  // ===========================================

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

        {/* 외부 로딩 중에는 스피너만 표시하여 깜빡임 완전 방지 */}
        {isLoading && mode === "edit" ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full mb-4"></div>
            <span className="text-gray-600 text-sm">
              데이터를 불러오는 중...
            </span>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4">
                {renderInputField("visitor_name", "성명", true)}
                {renderInputField("visitor_phone", "연락처", true)}
                {renderAddressField()}
                {renderPurposeField()}
                {renderInputField("vehicle_number", "차량번호")}
                {renderInputField("notes", "비고", false, "textarea")}
                {renderDisinfectionField()}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isFormDisabled}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isFormDisabled}
                  className="min-w-[80px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      처리중...
                    </>
                  ) : mode === "create" ? (
                    "등록"
                  ) : (
                    "수정"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
