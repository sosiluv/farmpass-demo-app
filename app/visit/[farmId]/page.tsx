/**
 * 방문자 등록 페이지
 *
 * QR 코드를 스캔한 방문자가 농장 방문 정보를 등록하는 페이지입니다.
 *
 * 주요 기능:
 * - 농장 정보 표시 (농장명, 관리자, 연락처)
 * - 축사출입금지 안내문구 표시
 * - 방문자 정보 입력 폼 (성명, 연락처, 주소, 차량번호, 방문목적, 소독여부, 비고)
 * - 카카오 주소 API 연동
 * - 개인정보 수집 동의
 * - 등록 완료 후 회사 홍보 페이지 연결
 *
 * @route /visit/[farmId]
 * @param farmId - 농장 고유 식별자 (UUID)
 */
"use client";
import { useParams } from "next/navigation";
import { FormSkeleton } from "@/components/common/skeletons";
import { FarmInfoCard } from "@/components/visitor/FarmInfoCard";
import { SuccessCard } from "@/components/visitor/SuccessCard";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useSystemSettingsContext } from "@/components/providers/system-settings-provider";
import { useVisitorForm } from "@/hooks/useVisitorForm";
import { VisitorForm } from "@/components/visitor/VisitorForm";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  getAuthErrorMessage,
  getImageUploadErrorMessage,
} from "@/lib/utils/validation/validation";
import { useEffect, useMemo } from "react";
import { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { VisitorSettings } from "@/lib/types/visitor";

/**
 * 방문자 등록 페이지 메인 컴포넌트
 *
 * QR 코드 스캔을 통해 접근하는 방문자 등록 폼을 제공합니다.
 * 농장 정보 표시, 방문자 정보 입력, 데이터 저장 기능을 포함합니다.
 */
export default function VisitPage() {
  const params = useParams();
  const farmId = params.farmId as string;
  const { showInfo, showSuccess, showError } = useCommonToast();

  // 전역 시스템 설정 사용
  const {
    settings: systemSettings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useSystemSettingsContext();

  // 시스템 설정에서 방문자 설정 추출
  const settings: VisitorSettings = useMemo(() => {
    if (!systemSettings) {
      return {
        reVisitAllowInterval: 6,
        maxVisitorsPerDay: 100,
        visitorDataRetentionDays: 1095,
        requireVisitorPhoto: false,
        requireVisitorContact: true,
        requireVisitPurpose: true,
      };
    }

    return {
      reVisitAllowInterval: systemSettings.reVisitAllowInterval,
      maxVisitorsPerDay: systemSettings.maxVisitorsPerDay,
      visitorDataRetentionDays: systemSettings.visitorDataRetentionDays,
      requireVisitorPhoto: systemSettings.requireVisitorPhoto,
      requireVisitorContact: systemSettings.requireVisitorContact,
      requireVisitPurpose: systemSettings.requireVisitPurpose,
    };
  }, [systemSettings]);

  const {
    formData,
    isSubmitting,
    isSubmitted,
    error,
    uploadedImageUrl,
    farm,
    farmLoading,
    farmError,
    handleSubmit,
    uploadImage,
    deleteImage,
  } = useVisitorForm(farmId, settings);

  // 에러 상태에 따른 토스트 처리
  useEffect(() => {
    if (error) {
      const authError = getAuthErrorMessage(error);
      showError("방문자 등록 오류", authError.message);
    }
  }, [error, showError]);

  // 농장 에러에 따른 토스트 처리
  useEffect(() => {
    if (farmError) {
      const authError = getAuthErrorMessage(farmError);
      showError("농장 정보 조회 실패", authError.message);
    }
  }, [farmError, showError]);

  // 설정 에러에 따른 토스트 처리
  useEffect(() => {
    if (settingsError) {
      const authError = getAuthErrorMessage(settingsError);
      showError("설정 로드 실패", authError.message);
    }
  }, [settingsError, showError]);

  // 폼 제출 핸들러 래핑
  const handleSubmitWrapped = async (data: VisitorFormData) => {
    try {
      showInfo("방문자 등록 중", "방문자 정보를 등록하는 중입니다...");
      const result = await handleSubmit(data);

      showSuccess(
        "방문자 등록 완료",
        result?.message || "방문자 정보를 등록하였습니다."
      );
      // 성공 시 토스트는 isSubmitted 상태 변경으로 처리
    } catch (error) {
      // 에러는 이미 error 상태로 처리됨
    }
  };

  // 이미지 업로드 핸들러 래핑 (토스트 처리 제거)
  const handleImageUploadWrapped = async (file: File) => {
    try {
      const result = await uploadImage(file);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // 이미지 삭제 핸들러 래핑 (토스트 처리 제거)
  const handleImageDeleteWrapped = async (fileName: string) => {
    try {
      await deleteImage();
    } catch (error) {
      throw error;
    }
  };

  if (farmLoading || isSettingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-2 sm:py-4">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl mx-auto px-3 sm:px-4">
          {farm && <FarmInfoCard farm={farm} />}
          <FormSkeleton
            fields={8}
            className="bg-white shadow-lg rounded-2xl p-6"
          />
        </div>
      </div>
    );
  }

  if (!farm || farmError) {
    throw new Error(
      farmError
        ? "농장 정보를 불러오는 중 오류가 발생했습니다."
        : "요청하신 농장이 존재하지 않거나 접근할 수 없습니다."
    );
  }

  if (isSubmitted) {
    return <SuccessCard />;
  }

  return (
    <ErrorBoundary
      title="방문자 등록 페이지 오류"
      description="방문자 등록 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="min-h-screen bg-gray-50 py-2 sm:py-4">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl mx-auto px-3 sm:px-4">
          <FarmInfoCard farm={farm} />
          <VisitorForm
            settings={settings}
            formData={formData}
            isSubmitting={isSubmitting}
            uploadedImageUrl={uploadedImageUrl}
            onSubmit={handleSubmitWrapped}
            onImageUpload={handleImageUploadWrapped}
            onImageDelete={handleImageDeleteWrapped}
            error={error}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
