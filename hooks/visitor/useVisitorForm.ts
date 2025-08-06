import { useState, useEffect } from "react";
import type { VisitorSettings } from "@/lib/types/visitor";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { handleError } from "@/lib/utils/error";
import { useUnifiedImageUpload } from "@/hooks/media/useUnifiedImageUpload";
import { createImageManager } from "@/lib/utils/media/unified-image-manager";

// React Query Hooks
import {
  useFarmInfoQuery,
  useVisitorSessionQuery,
  useDailyVisitorCountQuery,
  useCreateVisitorMutation,
} from "@/lib/hooks/query/use-visitor-form-query";

const initialFormData: VisitorFormData = {
  fullName: "",
  phoneNumber: "",
  address: "",
  detailedAddress: "",
  carPlateNumber: "",
  visitPurpose: "",
  disinfectionCheck: false,
  notes: "",
  profilePhoto: null,
  consentGiven: false,
};

export const useVisitorForm = (farmId: string, settings: VisitorSettings) => {
  const [formData, setFormData] = useState<VisitorFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // 통합 이미지 업로드 훅 (지연 업로드용)
  const visitorPhotoUpload = useUnifiedImageUpload({
    uploadType: "visitorPhoto",
    contextId: farmId, // farmId를 contextId로 전달
    // DB 저장 없음 - 폼 제출 시에만 실제 저장
    onUpdate: () => {
      // 방문자 등록 시에만 DB에 저장되므로 여기서는 아무것도 하지 않음
    },
    onError: (error) => {
      setError(`이미지 업로드 실패: ${error.message}`);
    },
  });

  // React Query Hooks
  const {
    data: farm,
    isLoading: farmLoading,
    error: farmError,
  } = useFarmInfoQuery(farmId);

  const { data: sessionData, isLoading: sessionLoading } =
    useVisitorSessionQuery(farmId, !isInitialized && !!farmId);

  const { data: dailyCountData, refetch: refetchDailyCount } =
    useDailyVisitorCountQuery(farmId, false); // 수동으로 조회

  const createVisitorMutation = useCreateVisitorMutation();

  // isLoading은 세션 로딩 상태를 참조
  const isLoading = sessionLoading;

  // 세션 기반 재방문 체크 (React Query 사용)
  useEffect(() => {
    if (!isInitialized && farmId && sessionData) {
      // 첫 방문이 아닌 경우, 항상 이전 방문 정보로 폼 초기화
      if (!sessionData.isFirstVisit && sessionData.lastVisit) {
        const { lastVisit, sessionInfo } = sessionData;

        // 이전 방문 정보로 폼 초기화 (항상 실행)
        setFormData({
          ...initialFormData,
          fullName: lastVisit.visitorName,
          phoneNumber: lastVisit.visitorPhone || "",
          address: lastVisit.visitorAddress,
          detailedAddress: lastVisit.visitorDetailedAddress || "",
          carPlateNumber: lastVisit.carPlateNumber || "",
          visitPurpose: lastVisit.visitPurpose || "",
          profilePhotoUrl: lastVisit.profilePhotoUrl || "",
        });

        // 이전 이미지 URL이 있으면 uploadedImageUrl에도 설정
        if (lastVisit.profilePhotoUrl) {
          setUploadedImageUrl(lastVisit.profilePhotoUrl);
        }

        // 재방문 허용 시간이 남아있다면 에러 메시지 설정 (폼은 여전히 사용 가능)
        if (sessionInfo.remainingHours > 0) {
          setError(
            `마지막 방문 후 ${
              sessionInfo.reVisitAllowInterval
            }시간 후에 재방문이 가능합니다. (남은 시간: ${Math.ceil(
              sessionInfo.remainingHours
            )}시간)`
          );
        }
      }

      setIsInitialized(true);
    }
  }, [sessionData, farmId, isInitialized]);

  // Base64 프리뷰용 이미지 업로드 함수 (기존 로직 유지)
  const uploadImage = async (file: File) => {
    setIsImageUploading(true);
    try {
      // Base64 프리뷰 생성 (즉시 Storage 업로드 안함)
      const previewUrl = URL.createObjectURL(file);
      setUploadedImageUrl(previewUrl);
      setSelectedImageFile(file);
      return { publicUrl: previewUrl, fileName: file.name };
    } finally {
      setIsImageUploading(false);
    }
  };

  // 이미지 삭제 헬퍼 함수 (중복 제거)
  const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
    if (!imageUrl || imageUrl.startsWith("blob:")) return;

    try {
      const deleteManager = createImageManager("visitorPhoto", farmId);
      await deleteManager.deleteImage(imageUrl);
    } catch (error) {
      console.warn("이미지 삭제 실패:", error);
      throw error; // 상위에서 처리하도록 에러 전파
    }
  };

  // 방문자 이미지 삭제 함수
  const deleteImage = async () => {
    try {
      // 현재 업로드된 이미지가 있는 경우 스토리지에서 삭제
      if (uploadedImageUrl) {
        await deleteImageFromStorage(uploadedImageUrl);
      }
    } catch (error) {
      // 삭제 실패해도 UI에서는 제거 (사용자 경험 우선)
      console.warn("이미지 삭제 중 오류 발생:", error);
    } finally {
      // 상태 초기화 (삭제 성공/실패와 관계없이)
      setUploadedImageUrl(null);
      setSelectedImageFile(null);
      setFormData((prev) => ({
        ...prev,
        profilePhotoUrl: "",
      }));
    }
  };

  const handleSubmit = async (data: VisitorFormData) => {
    // React Hook Form에서 이미 검증된 데이터를 받음
    setFormData(data);

    setIsSubmitting(true);
    setError(null);

    try {
      // 일일 방문자 수 체크 (React Query 사용)
      const { data: countData } = await refetchDailyCount();
      const { count = 0 } = countData || {};

      if (count >= settings.maxVisitorsPerDay) {
        const errorMessage = `일일 방문자 수 초과: ${count} / ${settings.maxVisitorsPerDay}`;
        setError(errorMessage);
        handleError(new Error(errorMessage), "일일 방문자 수 초과");
        return;
      }

      // 프로필 사진 업로드 (제출 시에만 실제 업로드)
      let profile_photo_url = null; // 초기값을 null로

      // 1. 새로 선택된 이미지가 있으면 업로드
      if (selectedImageFile) {
        try {
          // 기존 이미지가 있고 새 이미지를 업로드하는 경우, 기존 이미지 삭제
          if (
            formData.profilePhotoUrl &&
            !formData.profilePhotoUrl.startsWith("blob:")
          ) {
            await deleteImageFromStorage(formData.profilePhotoUrl);
          }

          // 새 이미지 업로드 (기존 hook 사용)
          const result = await visitorPhotoUpload.uploadImage(
            selectedImageFile
          );
          if (result) {
            profile_photo_url = result.publicUrl;
          }
        } catch (error) {
          setError("이미지 업로드에 실패했습니다");
          return;
        }
      }
      // 2. 기존 이미지가 있으면 그대로 사용 (blob이 아닌 경우만)
      else if (
        formData.profilePhotoUrl &&
        !formData.profilePhotoUrl.startsWith("blob:")
      ) {
        profile_photo_url = formData.profilePhotoUrl;
      }

      // 방문자 등록 (React Query Mutation 사용)
      const result = await createVisitorMutation.mutateAsync({
        farmId,
        visitorData: data,
        profilePhotoUrl: profile_photo_url, // 실제 URL만 저장
      });

      setIsSubmitted(true);
      setFormData(initialFormData);
      setUploadedImageUrl(null);
      setSelectedImageFile(null);
      // 토스트는 컴포넌트에서 처리
      return result; // <-- API 응답 반환
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      // 에러는 apiClient에서 공통 처리됨
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isSubmitted,
    error,
    isLoading,
    uploadedImageUrl,
    farm,
    farmLoading,
    farmError,
    handleSubmit,
    uploadImage,
    deleteImage,
    isImageUploading,
  };
};
