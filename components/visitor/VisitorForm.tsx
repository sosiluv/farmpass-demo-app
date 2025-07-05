"use client";

import React, { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressSearch } from "@/components/common/address-search";
import { ImageUpload } from "@/components/ui/image-upload";
import { Logo } from "@/components/common";
import {
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Car,
  FileText,
  Shield,
} from "lucide-react";
import type { VisitorFormData, VisitorSettings } from "@/lib/types/visitor";
import { VISITOR_CONSTANTS } from "@/lib/constants/visitor";
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

interface VisitorFormProps {
  settings: VisitorSettings;
  formData: VisitorFormData;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  uploadedImageUrl: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onInputChange: (
    field: keyof VisitorFormData,
    value: string | boolean | File | null
  ) => void;
  onImageUpload: (
    file: File
  ) => Promise<{ publicUrl: string; fileName: string } | void>;
  onImageDelete: (fileName: string) => Promise<void>;
  isImageUploading: boolean;
}

export const VisitorForm = ({
  settings,
  formData,
  isSubmitting,
  isLoading,
  error,
  uploadedImageUrl,
  onSubmit,
  onInputChange,
  onImageUpload,
  onImageDelete,
  isImageUploading,
}: VisitorFormProps) => {
  const [logoError, setLogoError] = useState(false);
  const { showInfo, showWarning } = useCommonToast();

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
    <Card className="shadow-lg rounded-lg sm:rounded-2xl border border-gray-100 bg-white/95">
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
      <CardContent className="pt-3 sm:pt-6 pb-3 sm:pb-6 px-4 sm:px-8">
        {/* 프로필 사진 업로드 영역 */}
        <div className="mb-3 sm:mb-6 flex flex-col items-center">
          <ImageUpload
            onUpload={async (file) => {
              if (file) {
                showInfo(
                  "이미지 업로드 시작",
                  "이미지를 업로드하는 중입니다..."
                );
                if (
                  !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(
                    file.type
                  )
                ) {
                  showWarning(
                    "파일 형식 오류",
                    `허용되지 않은 파일 형식입니다. ${ALLOWED_IMAGE_EXTENSIONS.join(
                      ", "
                    )} 만 업로드 가능합니다.`
                  );
                  return;
                }
                onInputChange("profilePhoto", file);
                await onImageUpload(file);
              }
            }}
            onDelete={async () => {
              showInfo("이미지 삭제 시작", "이미지를 삭제하는 중입니다...");
              if (uploadedImageUrl) {
                const fileName = uploadedImageUrl.split("/").pop();
                if (fileName) {
                  onImageDelete(fileName).catch(devLog.error);
                }
              }
              onInputChange("profilePhoto", null);
            }}
            currentImage={
              uploadedImageUrl ||
              (formData.profilePhoto
                ? URL.createObjectURL(formData.profilePhoto)
                : null)
            }
            required={settings.requireVisitorPhoto}
            showCamera={true}
            avatarSize="md"
            label={VISITOR_CONSTANTS.LABELS.PROFILE_PHOTO}
            className="shadow border border-gray-100 bg-white rounded-lg sm:rounded-xl p-2 sm:p-4"
          />
        </div>
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            {/* 성명 */}
            <div className="space-y-2 sm:space-y-2">
              <Label
                htmlFor="fullName"
                className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {VISITOR_CONSTANTS.LABELS.FULL_NAME}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => onInputChange("fullName", e.target.value)}
                placeholder={VISITOR_CONSTANTS.PLACEHOLDERS.FULL_NAME}
                required
                className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
              />
            </div>
            {/* 연락처 */}
            <div className="space-y-2 sm:space-y-2">
              <Label
                htmlFor="phoneNumber"
                className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
              >
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {VISITOR_CONSTANTS.LABELS.PHONE_NUMBER}
                {settings.requireVisitorContact && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => onInputChange("phoneNumber", e.target.value)}
                placeholder={VISITOR_CONSTANTS.PLACEHOLDERS.PHONE_NUMBER}
                className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
              />
            </div>
            {/* 주소 */}
            <div className="space-y-2 sm:space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {VISITOR_CONSTANTS.LABELS.ADDRESS}
                <span className="text-red-500">*</span>
              </Label>
              <AddressSearch
                onSelect={(address, detailedAddress) => {
                  onInputChange("address", address);
                  onInputChange("detailedAddress", detailedAddress);
                }}
                defaultDetailedAddress={formData.detailedAddress}
              />
              {formData.address && (
                <div className="mt-2 p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-xs sm:text-sm">
                    <div className="font-medium text-gray-700">
                      선택된 주소:
                    </div>
                    <div className="text-gray-600 mt-1">
                      {formData.address}
                      {formData.detailedAddress && (
                        <span className="text-blue-600">
                          {" "}
                          {formData.detailedAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* 차량번호 */}
            <div className="space-y-2 sm:space-y-2">
              <Label
                htmlFor="carPlateNumber"
                className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
              >
                <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {VISITOR_CONSTANTS.LABELS.CAR_PLATE}
              </Label>
              <Input
                id="carPlateNumber"
                value={formData.carPlateNumber}
                onChange={(e) =>
                  onInputChange("carPlateNumber", e.target.value.toUpperCase())
                }
                placeholder={VISITOR_CONSTANTS.PLACEHOLDERS.CAR_PLATE}
                className="h-10 sm:h-12 bg-gray-50 border border-gray-200 uppercase text-sm"
              />
            </div>
            {/* 방문목적 */}
            <div className="space-y-2 sm:space-y-2">
              <Label
                htmlFor="visitPurpose"
                className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {VISITOR_CONSTANTS.LABELS.VISIT_PURPOSE}
                {settings.requireVisitPurpose && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Select
                value={formData.visitPurpose}
                onValueChange={(value) => onInputChange("visitPurpose", value)}
                required={settings.requireVisitPurpose}
              >
                <SelectTrigger className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm">
                  <SelectValue
                    placeholder={VISITOR_CONSTANTS.PLACEHOLDERS.VISIT_PURPOSE}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="납품">납품</SelectItem>
                  <SelectItem value="점검">점검</SelectItem>
                  <SelectItem value="미팅">미팅</SelectItem>
                  <SelectItem value="수의사 진료">수의사 진료</SelectItem>
                  <SelectItem value="사료 배송">사료 배송</SelectItem>
                  <SelectItem value="방역">방역</SelectItem>
                  <SelectItem value="견학">견학</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* 비고 */}
            <div className="space-y-2 sm:space-y-2 md:col-span-2">
              <Label
                htmlFor="notes"
                className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {VISITOR_CONSTANTS.LABELS.NOTES}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => onInputChange("notes", e.target.value)}
                placeholder={VISITOR_CONSTANTS.PLACEHOLDERS.NOTES}
                rows={3}
                className="resize-none bg-gray-50 border border-gray-200 text-sm"
              />
            </div>
          </div>
          {/* 소독여부 - 개인정보 동의 위에 단독 배치 */}
          <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg mb-3 sm:mb-4 mt-2">
            <Checkbox
              id="disinfectionCheck"
              checked={formData.disinfectionCheck}
              onCheckedChange={(checked) =>
                onInputChange("disinfectionCheck", !!checked)
              }
              className="w-4 h-4 sm:w-5 sm:h-5"
            />
            <Label
              htmlFor="disinfectionCheck"
              className="flex items-center gap-1.5 sm:gap-2 font-medium text-sm sm:text-base"
            >
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              {VISITOR_CONSTANTS.LABELS.DISINFECTION}
            </Label>
          </div>
          {/* 개인정보 동의 */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="consentGiven"
                checked={formData.consentGiven}
                onCheckedChange={(checked) =>
                  onInputChange("consentGiven", !!checked)
                }
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5"
              />
              <Label
                htmlFor="consentGiven"
                className="text-xs sm:text-sm leading-relaxed"
              >
                <span className="font-medium">
                  {VISITOR_CONSTANTS.LABELS.CONSENT}
                </span>
                <span className="text-red-500 ml-1">*</span>
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  수집된 정보는 방역 관리 목적으로만 사용되며, 관련 법령에 따라
                  보관됩니다.
                </span>
              </Label>
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-3 sm:mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
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
      </CardContent>
    </Card>
  );
};
