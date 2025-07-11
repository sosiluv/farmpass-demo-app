"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressSearch } from "@/components/common/address-search";
import { ImageUpload } from "@/components/ui/image-upload";
import { Logo } from "@/components/common";
import { formatPhone } from "@/lib/utils/validation/validation";
import {
  User,
  Phone,
  MapPin,
  Car,
  FileText,
  Shield,
  AlertTriangle,
} from "lucide-react";
import type { VisitorSettings } from "@/lib/types/visitor";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { createVisitorFormSchema } from "@/lib/utils/validation/visitor-validation";
import { Loading } from "@/components/ui/loading";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { FormSkeleton } from "@/components/common/skeletons";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
} from "@/lib/constants/upload";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "../ui/alert";

interface VisitorFormProps {
  settings: VisitorSettings;
  formData: VisitorFormData;
  isSubmitting: boolean;
  isLoading: boolean;
  uploadedImageUrl: string | null;
  error?: string | null;
  onSubmit: (data: VisitorFormData) => Promise<void>;
  onImageUpload: (
    file: File
  ) => Promise<{ publicUrl: string; fileName: string } | void>;
  onImageDelete: (fileName: string) => Promise<void>;
}

// 폼 필드 설정
const FORM_FIELDS = {
  fullName: { icon: User, required: true, fullWidth: false },
  phoneNumber: { icon: Phone, required: true, fullWidth: false },
  address: { icon: MapPin, required: true, fullWidth: true },
  carPlateNumber: { icon: Car, required: false, fullWidth: false },
  visitPurpose: { icon: FileText, required: true, fullWidth: false },
  notes: { icon: FileText, required: false, fullWidth: true },
} as const;

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

// 라벨/플레이스홀더 직접 선언
const LABELS = {
  VISIT_PURPOSE: "방문목적",
  FULL_NAME: "성명",
  PHONE_NUMBER: "연락처",
  ADDRESS: "주소",
  CAR_PLATE: "차량번호",
  DISINFECTION: "소독여부",
  NOTES: "비고",
  PROFILE_PHOTO: "프로필 사진",
  CONSENT: "개인정보 수집 및 이용에 동의합니다",
};

const PLACEHOLDERS = {
  FULL_NAME: "홍길동",
  PHONE_NUMBER: "숫자만 입력 가능합니다",
  CAR_PLATE: "12가3456 (선택사항)",
  VISIT_PURPOSE: "방문 목적을 선택하세요",
  NOTES: "추가 사항이 있으면 입력해주세요",
};

export const VisitorForm = ({
  settings,
  formData,
  isSubmitting,
  isLoading,
  uploadedImageUrl,
  error,
  onSubmit,
  onImageUpload,
  onImageDelete,
}: VisitorFormProps) => {
  const [logoError, setLogoError] = React.useState(false);
  const { showInfo, showWarning } = useCommonToast();

  // 동적 스키마 생성
  const visitorSchema = createVisitorFormSchema(settings, uploadedImageUrl);

  // React Hook Form 설정
  const form = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
    defaultValues: formData,
  });

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File) => {
    showInfo("이미지 업로드 시작", "이미지를 업로드하는 중입니다...");

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      showWarning(
        "파일 형식 오류",
        `허용되지 않은 파일 형식입니다. ${ALLOWED_IMAGE_EXTENSIONS.join(
          ", "
        )} 만 업로드 가능합니다.`
      );
      return;
    }

    await onImageUpload(file);
  };

  // 이미지 삭제 핸들러
  // const handleImageDelete = async () => {
  //   showInfo("이미지 삭제 시작", "이미지를 삭제하는 중입니다...");

  //   if (uploadedImageUrl) {
  //     const fileName = uploadedImageUrl.split("/").pop();
  //     if (fileName) {
  //       onImageDelete(fileName).catch(devLog.error);
  //     }
  //   }
  // };

  // 필드명을 라벨 키로 매핑
  const getLabelKey = (
    fieldName: keyof VisitorFormData
  ): keyof typeof LABELS => {
    const mapping: Record<keyof VisitorFormData, keyof typeof LABELS> = {
      fullName: "FULL_NAME",
      phoneNumber: "PHONE_NUMBER",
      address: "ADDRESS",
      detailedAddress: "ADDRESS",
      carPlateNumber: "CAR_PLATE",
      visitPurpose: "VISIT_PURPOSE",
      disinfectionCheck: "DISINFECTION",
      notes: "NOTES",
      profilePhoto: "PROFILE_PHOTO",
      consentGiven: "CONSENT",
    };
    return mapping[fieldName];
  };

  // 필드명을 플레이스홀더 키로 매핑
  const getPlaceholderKey = (
    fieldName: keyof VisitorFormData
  ): keyof typeof PLACEHOLDERS | null => {
    const mapping: Record<
      keyof VisitorFormData,
      keyof typeof PLACEHOLDERS | null
    > = {
      fullName: "FULL_NAME",
      phoneNumber: "PHONE_NUMBER",
      address: null,
      detailedAddress: null,
      carPlateNumber: "CAR_PLATE",
      visitPurpose: "VISIT_PURPOSE",
      disinfectionCheck: null,
      notes: "NOTES",
      profilePhoto: null,
      consentGiven: null,
    };
    return mapping[fieldName];
  };

  // 텍스트 필드 렌더링
  const renderTextField = (
    name: keyof VisitorFormData,
    fieldConfig: (typeof FORM_FIELDS)[keyof typeof FORM_FIELDS]
  ) => {
    const Icon = fieldConfig.icon;
    const isRequired = fieldConfig.required;
    const isFullWidth = fieldConfig.fullWidth;
    const labelKey = getLabelKey(name);
    const placeholderKey = getPlaceholderKey(name);

    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem
            className={`space-y-2 sm:space-y-2 ${
              isFullWidth ? "md:col-span-2" : ""
            }`}
          >
            <FormLabel className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {LABELS[labelKey]}
              {isRequired && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              {name === "notes" ? (
                <Textarea
                  {...field}
                  placeholder={
                    placeholderKey ? PLACEHOLDERS[placeholderKey] : ""
                  }
                  rows={3}
                  className="resize-none bg-gray-50 border border-gray-200 text-sm"
                />
              ) : name === "carPlateNumber" ? (
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  placeholder={
                    placeholderKey ? PLACEHOLDERS[placeholderKey] : ""
                  }
                  className="h-10 sm:h-12 bg-gray-50 border border-gray-200 uppercase text-sm"
                />
              ) : name === "address" ? (
                <AddressSearch
                  onSelect={(address, detailedAddress) => {
                    field.onChange(address);
                    form.setValue("detailedAddress", detailedAddress);
                  }}
                  defaultDetailedAddress={formData.detailedAddress}
                />
              ) : name === "phoneNumber" ? (
                <Input
                  {...field}
                  type="tel"
                  onChange={(e) => {
                    const formattedPhone = formatPhone(e.target.value);
                    field.onChange(formattedPhone);
                  }}
                  placeholder={
                    placeholderKey ? PLACEHOLDERS[placeholderKey] : ""
                  }
                  maxLength={13}
                  className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
                />
              ) : (
                <Input
                  {...field}
                  placeholder={
                    placeholderKey ? PLACEHOLDERS[placeholderKey] : ""
                  }
                  className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
                />
              )}
            </FormControl>
            <FormMessage />
            {name === "address" && field.value && (
              <div className="mt-2 p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs sm:text-sm">
                  <div className="font-medium text-gray-700">선택된 주소:</div>
                  <div className="text-gray-600 mt-1">
                    {field.value}
                    {form.watch("detailedAddress") && (
                      <span className="text-blue-600">
                        {" "}
                        {form.watch("detailedAddress")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </FormItem>
        )}
      />
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-2xl">
        <CardContent className="pt-8 pb-8">
          <FormSkeleton fields={8} className="px-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-lg sm:rounded-2xl border border-gray-100 bg-white/95 max-w-lg mx-auto">
      <CardHeader className="text-center pb-2 sm:pb-3 border-b border-gray-100 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-2xl font-bold tracking-tight text-gray-900">
          방문자 등록
        </CardTitle>
        <div className="flex flex-col items-center py-1.5 sm:py-2">
          {!logoError ? (
            <img
              src="/default-logo1.png"
              alt="회사 로고"
              className="w-[60%] sm:w-80 h-auto max-w-[140px] sm:max-w-md mb-1.5 sm:mb-4 drop-shadow"
              style={{ objectFit: "contain" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Logo size="xl" className="mb-3 sm:mb-4 text-blue-500" />
          )}
        </div>
        <CardDescription className="text-center text-xs sm:text-base text-gray-600 px-2">
          방문 정보를 정확히 입력해주세요. 모든 정보는 방역 관리 목적으로만
          사용됩니다.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 w-full">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 sm:space-y-6"
          >
            {/* 프로필 사진 업로드 */}
            {settings.requireVisitorPhoto && (
              <FormField
                control={form.control}
                name="profilePhoto"
                render={({ field }) => (
                  <FormItem className="mb-3 sm:mb-6 w-full flex flex-col items-center">
                    <FormLabel className="sr-only">
                      {LABELS.PROFILE_PHOTO}
                    </FormLabel>
                    <FormControl>
                      <ImageUpload
                        onUpload={handleImageUpload}
                        // onDelete={handleImageDelete}
                        currentImage={
                          uploadedImageUrl ||
                          formData.profilePhotoUrl ||
                          (field.value
                            ? URL.createObjectURL(field.value)
                            : null)
                        }
                        required={settings.requireVisitorPhoto}
                        showCamera={true}
                        avatarSize="xl"
                        label={LABELS.PROFILE_PHOTO}
                        className="shadow border border-gray-100 bg-white rounded-lg sm:rounded-xl p-2 sm:p-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              {/* 기본 필드들 */}
              {renderTextField("fullName", FORM_FIELDS.fullName)}

              {settings.requireVisitorContact &&
                renderTextField("phoneNumber", FORM_FIELDS.phoneNumber)}

              {renderTextField("address", FORM_FIELDS.address)}
              {renderTextField("carPlateNumber", FORM_FIELDS.carPlateNumber)}

              {/* 방문목적 */}
              {settings.requireVisitPurpose && (
                <FormField
                  control={form.control}
                  name="visitPurpose"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:space-y-2">
                      <FormLabel className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {LABELS.VISIT_PURPOSE}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm">
                            <SelectValue
                              placeholder={PLACEHOLDERS.VISIT_PURPOSE}
                            />
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
              )}

              {renderTextField("notes", FORM_FIELDS.notes)}
            </div>

            {/* 소독여부 */}
            <FormField
              control={form.control}
              name="disinfectionCheck"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg mb-3 sm:mb-4 mt-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <Label className="flex items-center gap-1.5 sm:gap-2 font-medium text-sm sm:text-base">
                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                        {LABELS.DISINFECTION}
                      </Label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 개인정보 동의 */}
            <FormField
              control={form.control}
              name="consentGiven"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <Label className="text-xs sm:text-sm leading-relaxed">
                        <span className="font-medium">{LABELS.CONSENT}</span>
                        <span className="text-red-500 ml-1">*</span>
                        <br />
                        <span className="text-xs text-muted-foreground mt-1 block">
                          수집된 정보는 방역 관리 목적으로만 사용되며, 관련
                          법령에 따라 보관됩니다.
                        </span>
                      </Label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:from-blue-600 hover:to-indigo-600 transition-colors mt-4 sm:mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loading
                    spinnerSize={16}
                    showText={false}
                    minHeight="auto"
                    className="mr-2"
                  />
                  등록 중...
                </>
              ) : (
                "방문 등록"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
