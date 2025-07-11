import { useState, useEffect, useCallback } from "react";
import {
  uploadImageUniversal,
  deleteImageUniversal,
} from "@/lib/utils/media/image-upload";
import type { VisitorSettings } from "@/lib/types/visitor";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants/upload";
import { handleError } from "@/lib/utils/error";
import { v4 as uuidv4 } from "uuid";
import { extractStorageFileName } from "@/lib/utils/media/image-upload";

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
          profilePhotoUrl: lastVisit.profilePhotoUrl || "", // 추가
        });

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

  // Base64 프리뷰용 이미지 업로드 함수
  const uploadImage = async (file: File) => {
    setIsImageUploading(true);
    try {
      // Base64 프리뷰 생성
      const previewUrl = URL.createObjectURL(file);
      setUploadedImageUrl(previewUrl);
      setSelectedImageFile(file);
      return { publicUrl: previewUrl, fileName: file.name };
    } finally {
      setIsImageUploading(false);
    }
  };

  // 방문자 이미지 삭제 함수
  const deleteImage = async () => {
    // 기존 파일명 추출 (실제 업로드된 파일인 경우만)
    let prevFileName: string | undefined = undefined;
    const url = uploadedImageUrl || formData.profilePhotoUrl;
    if (url && !url.startsWith("blob:")) {
      // Base64가 아닌 실제 URL인 경우만
      prevFileName = extractStorageFileName(url, "visitor-photos");
    }
    if (prevFileName) {
      await deleteImageUniversal({
        bucket: "visitor-photos",
        fileName: prevFileName,
      });
    }
    setUploadedImageUrl(null);
    setSelectedImageFile(null);
    setFormData((prev) => ({ ...prev, profilePhotoUrl: null }));
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
          // 기존 파일명 추출 (실제 업로드된 파일인 경우만)
          let prevFileName: string | undefined = undefined;

          // 1. 기존 DB에 저장된 이미지가 있는지 확인 (우선순위)
          if (
            formData.profilePhotoUrl &&
            !formData.profilePhotoUrl.startsWith("blob:")
          ) {
            prevFileName = extractStorageFileName(
              formData.profilePhotoUrl,
              "visitor-photos"
            );
            console.log("기존 DB 이미지 삭제:", prevFileName);
          }
          // 2. 새로 업로드된 이미지가 있는지 확인 (blob이 아닌 경우)
          else if (uploadedImageUrl && !uploadedImageUrl.startsWith("blob:")) {
            prevFileName = extractStorageFileName(
              uploadedImageUrl,
              "visitor-photos"
            );
            console.log("새로 업로드된 이미지 삭제:", prevFileName);
          }

          // 기존 파일이 있으면 먼저 삭제
          if (prevFileName) {
            console.log("삭제할 파일:", prevFileName);
            await deleteImageUniversal({
              bucket: "visitor-photos",
              fileName: prevFileName,
            });
            console.log("기존 파일 삭제 완료");
          } else {
            console.log("삭제할 기존 파일 없음");
          }

          // 새 이미지 업로드 (prevFileName 제거 - 이미 삭제했으므로)
          const result = await uploadImageUniversal({
            file: selectedImageFile,
            bucket: "visitor-photos",
            allowedTypes: [...ALLOWED_IMAGE_TYPES],
            maxSizeMB: MAX_UPLOAD_SIZE_MB,
            path: (() => {
              const ext =
                selectedImageFile.name.split(".").pop()?.toLowerCase() || "jpg";
              return `${farmId}/${uuidv4()}.${ext}`;
            })(),
          });
          profile_photo_url = result.publicUrl; // 실제 Supabase URL
        } catch (error) {
          setError("이미지 업로드에 실패했습니다");
          handleError(error as Error, "이미지 업로드");
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
      await createVisitorMutation.mutateAsync({
        farmId,
        visitorData: data,
        profilePhotoUrl: profile_photo_url, // 실제 URL만 저장
      });

      setIsSubmitted(true);
      setFormData(initialFormData);
      setUploadedImageUrl(null);
      setSelectedImageFile(null);
      // 토스트는 컴포넌트에서 처리
    } catch (err) {
      setError("방문자 등록에 실패했습니다");
      handleError(err as Error, "방문자 등록");
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
