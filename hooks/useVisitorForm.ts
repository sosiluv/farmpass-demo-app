import { useState, useEffect, useCallback } from "react";
import {
  uploadImageUniversal,
  deleteImageUniversal,
} from "@/lib/utils/media/image-upload";
import type { VisitorSettings } from "@/lib/types/visitor";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { Farm as VisitorFarm } from "@/lib/types/visitor";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants/upload";
import { handleError } from "@/lib/utils/error";

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
      // 첫 방문이 아닌 경우, 이전 방문 정보로 폼 초기화
      if (!sessionData.isFirstVisit && sessionData.lastVisit) {
        const { lastVisit, sessionInfo } = sessionData;

        // 재방문 제한 메시지에 남은 시간 표시
        setError(
          `${sessionInfo.reVisitAllowInterval} (남은 시간: ${Math.ceil(
            sessionInfo.remainingHours
          )}시간)`
        );

        // 이전 방문 정보로 폼 초기화
        setFormData({
          ...initialFormData,
          fullName: lastVisit.visitorName,
          phoneNumber: lastVisit.visitorPhone || "",
          address: lastVisit.visitorAddress,
          detailedAddress: lastVisit.visitorDetailedAddress || "",
          carPlateNumber: lastVisit.carPlateNumber || "",
          visitPurpose: lastVisit.visitPurpose || "",
        });
      }

      setIsInitialized(true);
    }
  }, [sessionData, farmId, isInitialized]);

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

      // 프로필 사진 업로드
      let profile_photo_url = uploadedImageUrl;
      if (data.profilePhoto && !uploadedImageUrl) {
        try {
          const result = await uploadImage(data.profilePhoto);
          profile_photo_url = result?.publicUrl || null;
        } catch (error) {
          setError("이미지 업로드에 실패했습니다");
          handleError(error as Error, "이미지 업로드");
          return;
        }
      }

      // 방문자 등록 (React Query Mutation 사용)
      await createVisitorMutation.mutateAsync({
        farmId,
        visitorData: data,
        profilePhotoUrl: profile_photo_url,
      });

      setIsSubmitted(true);
      setFormData(initialFormData);
      setUploadedImageUrl(null);
      // 토스트는 컴포넌트에서 처리
    } catch (err) {
      setError("방문자 등록에 실패했습니다");
      handleError(err as Error, "방문자 등록");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 이미지 업로드 함수
  const uploadImage = async (file: File) => {
    try {
      setIsImageUploading(true);

      const result = await uploadImageUniversal({
        file,
        bucket: "visitor-photos",
        farmId,
        maxSizeMB: MAX_UPLOAD_SIZE_MB,
        allowedTypes: [...ALLOWED_IMAGE_TYPES],
      });

      setUploadedImageUrl(result.publicUrl);
      // 토스트는 컴포넌트에서 처리
      return result;
    } catch (error) {
      handleError(error as Error, "이미지 업로드");
      throw error;
    } finally {
      setIsImageUploading(false);
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async (fileName: string) => {
    try {
      await deleteImageUniversal({
        bucket: "visitor-photos",
        fileName,
      });
      setUploadedImageUrl(null);
      // 토스트는 컴포넌트에서 처리
    } catch (error) {
      handleError(error as Error, "이미지 삭제");
      throw error;
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
