import { useState, useEffect, useCallback } from "react";
import {
  uploadImageUniversal,
  deleteImageUniversal,
} from "@/lib/utils/media/image-upload";
import type { VisitorFormData, VisitorSettings } from "@/lib/types/visitor";
import type { Farm as VisitorFarm } from "@/lib/types/visitor";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants/upload";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";

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
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [farm, setFarm] = useState<VisitorFarm | null>(null);
  const [farmLoading, setFarmLoading] = useState(true);
  const [farmError, setFarmError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 세션 기반 재방문 체크 함수 (useCallback으로 메모이제이션)
  const checkSession = useCallback(async () => {
    try {
      const data = await apiClient(
        `/api/farms/${farmId}/visitors/check-session`,
        {
          method: "GET",
          context: "세션 체크",
          onError: (error, context) => {
            handleError(error, {
              context,
              onStateUpdate: (errorMessage) => {
                setError(errorMessage);
              },
            });
          },
        }
      );

      // 첫 방문이 아닌 경우, 이전 방문 정보로 폼 초기화
      if (!data.isFirstVisit && data.lastVisit) {
        const { lastVisit, sessionInfo } = data;

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
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  // 세션 기반 재방문 체크 (한 번만 실행)
  useEffect(() => {
    if (!isInitialized && farmId) {
      //checkSession();
      setIsInitialized(true);
    }
  }, [farmId, isInitialized, checkSession]);

  // 농장 정보 가져오기 함수 (useCallback으로 메모이제이션)
  const fetchFarm = useCallback(async () => {
    if (!farmId) {
      setFarmError("농장 ID가 없습니다.");
      setFarmLoading(false);
      return;
    }

    try {
      setFarmLoading(true);
      setFarmError(null);

      const result = await apiClient(`/api/farms/${farmId}`, {
        method: "GET",
        context: "농장 정보 조회",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              setFarmError(errorMessage);
            },
          });
        },
      });

      const farmData: VisitorFarm = {
        id: result.farm.id,
        farm_name: result.farm.farm_name,
        farm_address: result.farm.farm_address,
        manager_name: result.farm.manager_name || "",
        manager_phone: result.farm.manager_phone || "",
        farm_type: result.farm.farm_type || undefined,
      };

      setFarm(farmData);
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setFarmLoading(false);
    }
  }, [farmId]);

  // 농장 정보 가져오기 (한 번만 실행)
  useEffect(() => {
    if (!isInitialized && farmId) {
      fetchFarm();
    }
  }, [farmId, isInitialized, fetchFarm]);

  const validateForm = async () => {
    // 이름, 전화번호, 주소 등 단순 유효성 검사만 수행 (VisitorFormValidator 사용 금지)
    if (!formData.fullName) {
      setError("이름을 입력해주세요");
      return false;
    }
    if (settings.requireVisitorContact && !formData.phoneNumber) {
      setError("전화번호를 입력해주세요");
      return false;
    }
    if (!formData.address) {
      setError("주소를 입력해주세요");
      return false;
    }
    if (settings.requireVisitPurpose && !formData.visitPurpose) {
      setError("방문 목적을 입력해주세요");
      return false;
    }
    if (
      settings.requireVisitorPhoto &&
      !formData.profilePhoto &&
      !uploadedImageUrl
    ) {
      setError("프로필 사진을 등록해주세요");
      return false;
    }
    if (!formData.consentGiven) {
      setError("개인정보 수집 및 이용에 동의해주세요");
      return false;
    }
    // 차량번호 등 기타 검증은 필요시 추가
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 일일 방문자 수 체크
      const { count = 0, farm_name } = await apiClient(
        `/api/farms/${farmId}/visitors/count-today`,
        {
          method: "GET",
          context: "일일 방문자 수 체크",
          onError: (error, context) => {
            handleError(error, {
              context,
              onStateUpdate: (errorMessage) => {
                setError(errorMessage);
              },
            });
          },
        }
      );

      if (count >= settings.maxVisitorsPerDay) {
        const errorMessage = `일일 방문자 수 초과: ${count} / ${settings.maxVisitorsPerDay}`;
        setError(errorMessage);
        handleError(new Error(errorMessage), "일일 방문자 수 초과");
        return;
      }

      // 프로필 사진 업로드
      let profile_photo_url = uploadedImageUrl;
      if (formData.profilePhoto && !uploadedImageUrl) {
        try {
          const result = await uploadImage(formData.profilePhoto);
          profile_photo_url = result?.publicUrl || null;
        } catch (error) {
          setError("이미지 업로드에 실패했습니다");
          handleError(error as Error, "이미지 업로드");
          return;
        }
      }

      // 방문자 등록
      await apiClient(`/api/farms/${farmId}/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          profile_photo_url,
        }),
        context: "방문자 등록",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              setError(errorMessage);
            },
          });
        },
      });

      setIsSubmitted(true);
      setFormData(initialFormData);
      setUploadedImageUrl(null);
      // 토스트는 컴포넌트에서 처리
    } catch (err) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof VisitorFormData,
    value: string | boolean | File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // 이미지 업로드 함수
  const uploadImage = async (file: File) => {
    try {
      setIsImageUploading(true);

      const result = await uploadImageUniversal({
        file,
        bucket: "visitor-photos",
        farmId,
        visitorName: formData.fullName,
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
    handleInputChange,
    uploadImage,
    deleteImage,
    isImageUploading,
  };
};
