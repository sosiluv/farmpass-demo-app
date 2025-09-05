import { useCallback, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { handleError } from "@/lib/utils/error";
import { Plus, Pencil, Loader2, User } from "lucide-react";
import { updateVisitorFormSchema } from "@/lib/utils/validation/visitor-validation";
import type { VisitorSheetFormData } from "@/lib/utils/validation/visitor-validation";

import { Sheet } from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { LottieLoadingCompact } from "@/components/ui/lottie-loading";
import {
  CommonSheetHeader,
  CommonSheetFooter,
  CommonSheetContent,
} from "@/components/ui/sheet-common";

// 재사용 가능한 visitor form fields 컴포넌트들
import { TextField } from "@/components/visitor/form-fields/TextField";
import { PhoneField } from "@/components/visitor/form-fields/PhoneField";
import { AddressField } from "@/components/visitor/form-fields/AddressField";
import { VisitPurposeField } from "@/components/visitor/form-fields/VisitPurposeField";
import { CarPlateField } from "@/components/visitor/form-fields/CarPlateField";
import { DisinfectionField } from "@/components/visitor/form-fields/DisinfectionField";
import { NotesField } from "@/components/visitor/form-fields/NotesField";
import { ConsentField } from "@/components/visitor/form-fields/ConsentField";

import { LABELS, BUTTONS } from "@/lib/constants/visitor";
import { ScrollArea } from "@/components/ui/scroll-area";
import useBlockNavigation from "@/hooks/ui/use-before-unload";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";

// ===========================================
// 타입 및 상수 정의
// ===========================================

export interface VisitorFormValues extends VisitorSheetFormData {}

interface VisitorFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData?: VisitorSheetFormData;
  farmId: string;
  onSuccess: (values: VisitorSheetFormData) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_FORM_VALUES: VisitorFormValues = {
  id: "",
  farm_id: "",
  visitor_name: "",
  visitor_phone: "",
  visitor_address: "",
  detailed_address: "",
  visitor_purpose: "",
  vehicle_number: "",
  notes: "",
  disinfection_check: false,
  consent_given: false,
};

// ===========================================
// 메인 컴포넌트
// ===========================================

export function VisitorFormSheet({
  open,
  onOpenChange,
  mode = "create",
  initialData,
  farmId,
  onSuccess,
  isLoading = false,
}: VisitorFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const { showError } = useCommonToast();
  // 전체 로딩 상태 (외부 로딩 + 제출 중)
  const isFormDisabled = isLoading || isSubmitting;

  const handleSheetClose = useCallback(() => {
    setShowConfirmSheet(false);
    if (!isFormDisabled) {
      onOpenChange(false);
    }
  }, [isFormDisabled, onOpenChange]);
  // 뒤로가기 처리 - useBlockNavigation 훅 사용
  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } =
    useBlockNavigation(open, false, showConfirmSheet, handleSheetClose);

  // confirm 다이얼로그 처리
  useEffect(() => {
    if (isAttemptingNavigation) {
      setShowConfirmSheet(true);
    }
  }, [isAttemptingNavigation]);

  // 폼 초기화 데이터 계산 (깜빡임 방지를 위한 최적화)
  const formInitialValues = useMemo(() => {
    if (mode === "edit" && initialData) {
      // visitor_address에서 detailed_address 추출 (간단한 로직)
      const fullAddress = initialData.visitor_address || "";
      const lastSpaceIndex = fullAddress.lastIndexOf(" ");
      const address =
        lastSpaceIndex > 0
          ? fullAddress.substring(0, lastSpaceIndex)
          : fullAddress;
      const detailed_address =
        lastSpaceIndex > 0 ? fullAddress.substring(lastSpaceIndex + 1) : "";

      return {
        id: initialData.id || "",
        farm_id: initialData.farm_id || farmId,
        visitor_name: initialData.visitor_name || "",
        visitor_phone: initialData.visitor_phone || "",
        visitor_address: address,
        detailed_address:
          detailed_address || initialData.detailed_address || "",
        visitor_purpose: initialData.visitor_purpose,
        vehicle_number: initialData.vehicle_number,
        notes: initialData.notes,
        disinfection_check: initialData.disinfection_check || false,
        consent_given: initialData.consent_given || false,
      };
    }
    return DEFAULT_FORM_VALUES;
  }, [mode, initialData, farmId]);

  const form = useForm<VisitorFormValues>({
    resolver: zodResolver(updateVisitorFormSchema),
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
      await onSuccess(values);

      // 성공 시 다이얼로그 닫기
      onOpenChange(false);
    } catch (error) {
      handleError(error, "방문자 폼 제출");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("폼 제출 실패", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================================
  // 메인 렌더링
  // ===========================================

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetClose}>
        <CommonSheetContent
          side="bottom"
          enableDragToResize={true}
          onClose={handleSheetClose}
          open={open}
        >
          <CommonSheetHeader
            title={
              mode === "create"
                ? LABELS.VISITOR_FORM_SHEET_CREATE_TITLE
                : LABELS.VISITOR_FORM_SHEET_EDIT_TITLE
            }
            description={
              mode === "create"
                ? LABELS.VISITOR_FORM_SHEET_CREATE_DESC
                : LABELS.VISITOR_FORM_SHEET_EDIT_DESC
            }
            show={false}
          />

          {/* 외부 로딩 중에는 Lottie 애니메이션 표시하여 깜빡임 완전 방지 */}
          {isLoading && mode === "edit" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LottieLoadingCompact
                text={LABELS.VISITOR_FORM_SHEET_LOADING}
                size="md"
              />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <div className="space-y-2 sm:space-y-4 p-3">
                    <div className="grid gap-3 sm:gap-6 md:grid-cols-2 md:gap-4">
                      {/* 이름 필드 */}
                      <TextField
                        form={form}
                        name="visitor_name"
                        icon={User}
                        required={true}
                      />
                      {/* 전화번호 필드 */}
                      <PhoneField form={form} required={true} />
                      {/* 주소 필드 */}
                      <AddressField
                        form={form}
                        required={true}
                        defaultDetailedAddress={
                          formInitialValues.detailed_address
                        }
                      />
                      {/* 방문목적 필드 */}
                      <VisitPurposeField form={form} required={true} />
                      {/* 차량번호 필드 */}
                      <CarPlateField form={form} required={false} />
                      {/* 메모 필드 */}
                      <NotesField form={form} required={false} />
                      {/* 소독여부 필드 */}
                      <DisinfectionField form={form} />
                      {/* 동의 필드 */}
                      <ConsentField form={form} />
                    </div>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          )}

          <CommonSheetFooter
            onCancel={handleSheetClose}
            onConfirm={form.handleSubmit(handleSubmit)}
            cancelText={BUTTONS.VISITOR_FORM_SHEET_CANCEL}
            confirmText={
              isSubmitting
                ? BUTTONS.VISITOR_FORM_SHEET_PROCESSING
                : mode === "create"
                ? BUTTONS.VISITOR_FORM_SHEET_CREATE_BUTTON
                : BUTTONS.VISITOR_FORM_SHEET_EDIT_BUTTON
            }
            isLoading={isSubmitting}
            disabled={isFormDisabled}
            confirmIcon={
              isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="h-4 w-4 mr-2" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
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
        title={LABELS.VISITOR_FORM_CANCEL_TITLE}
        warningMessage={LABELS.VISITOR_FORM_CANCEL_DESCRIPTION}
        variant="warning"
      />
    </>
  );
}
