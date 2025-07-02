import { useState, useEffect, useCallback } from "react";
import {
  uploadImageUniversal,
  deleteImageUniversal,
} from "@/lib/utils/media/image-upload";
import { validateName, validateAddress } from "@/lib/utils/validation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { VISITOR_CONSTANTS } from "@/lib/constants/visitor";
import type { VisitorFormData, VisitorSettings } from "@/lib/types/visitor";
import { logApiError } from "@/lib/utils/logging/system-log";
import { VisitorFormValidator } from "@/lib/utils/logging/system-log";
import type { Farm as VisitorFarm } from "@/lib/types/visitor";

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
  const toast = useCommonToast();
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

  // 공통 에러 처리 함수
  const handleError = useCallback(
    (error: Error, title: string) => {
      devLog.error(`${title} error:`, error);
      toast.showCustomError(title, error.message);
    },
    [toast]
  );

  // 공통 성공 처리 함수
  const handleSuccess = useCallback(
    (title: string, description: string) => {
      toast.showCustomSuccess(title, description);
    },
    [toast]
  );

  // 세션 기반 재방문 체크 함수 (useCallback으로 메모이제이션)
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/farms/${farmId}/visitors/check-session`
      );
      if (!response.ok) throw new Error("Failed to check session");

      const data = await response.json();

      // 첫 방문이 아닌 경우, 이전 방문 정보로 폼 초기화
      if (!data.isFirstVisit && data.lastVisit) {
        const { lastVisit, sessionInfo } = data;

        // 재방문 제한 메시지에 남은 시간 표시
        setError(
          `${VISITOR_CONSTANTS.ERROR_MESSAGES.REVISIT_INTERVAL(
            sessionInfo.reVisitAllowInterval
          )} (남은 시간: ${Math.ceil(sessionInfo.remainingHours)}시간)`
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
    } catch (err) {
      handleError(err as Error, "Session check");
      // 방문자 세션 체크 API 에러 로그
      await logApiError(
        `/api/farms/${farmId}/visitors/check-session`,
        "GET",
        err instanceof Error ? err : String(err)
      );
    } finally {
      setIsLoading(false);
    }
  }, [farmId, handleError]);

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

      const response = await fetch(`/api/farms/${farmId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "농장 정보를 가져오는데 실패했습니다.");
      }

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
      setFarmError(
        error instanceof Error
          ? error.message
          : "농장 정보를 가져오는데 실패했습니다."
      );
      handleError(error as Error, "Farm fetch");
    } finally {
      setFarmLoading(false);
    }
  }, [farmId, handleError]);

  // 농장 정보 가져오기 (한 번만 실행)
  useEffect(() => {
    if (!isInitialized && farmId) {
      fetchFarm();
    }
  }, [farmId, isInitialized, fetchFarm]);

  const validateForm = async () => {
    // 새로운 통합 유효성 검사 시스템 사용
    const validator = new VisitorFormValidator(undefined, farmId);

    // 이름 검증
    validator.validateRequired("name", formData.fullName);
    if (formData.fullName) {
      const nameValidation = validateName(formData.fullName);
      if (!nameValidation.isValid) {
        validator.validateField(
          "name",
          formData.fullName,
          () => nameValidation
        );
      }
    }

    // 전화번호 검증 (필수인 경우)
    if (settings.requireVisitorContact) {
      validator.validateRequired("phone", formData.phoneNumber);
      if (formData.phoneNumber) {
        validator.validatePhone(formData.phoneNumber);
      }
    }

    // 주소 검증
    validator.validateRequired("address", formData.address);
    if (formData.address) {
      const addressValidation = validateAddress(formData.address);
      if (!addressValidation.isValid) {
        validator.validateField(
          "address",
          formData.address,
          () => addressValidation
        );
      }
    }

    // 차량번호 검증 (선택사항)
    if (formData.carPlateNumber) {
      validator.validateVehicleNumber(formData.carPlateNumber);
    }

    // 방문 목적 검증 (필수인 경우)
    if (settings.requireVisitPurpose) {
      validator.validateRequired("visitPurpose", formData.visitPurpose);
    }

    // 프로필 사진 검증 (필수인 경우)
    if (
      settings.requireVisitorPhoto &&
      !formData.profilePhoto &&
      !uploadedImageUrl
    ) {
      validator.validateRequired(
        "profilePhoto",
        formData.profilePhoto || uploadedImageUrl
      );
    }

    // 개인정보 동의 검증
    validator.validateRequired("consentGiven", formData.consentGiven);

    // 통합 검증 완료 및 결과 로깅 (총 8개 필드)
    const isValid = await validator.finalize(8);

    if (!isValid) {
      const errors = validator.getErrors();
      const firstError = errors[0];
      if (firstError) {
        setError(firstError.message);
        handleError(new Error(firstError.message), "입력 검증 오류");
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 일일 방문자 수 체크
      // const visitorCountResponse = await fetch(
      //   `/api/farms/${farmId}/visitors/count-today`
      // );
      // if (visitorCountResponse.ok) {
      //   const { count, farm_name } = await visitorCountResponse.json();
      //   if (count >= settings.maxVisitorsPerDay) {
      //     // 일일 방문자 수 초과 로그
      //     await logBusinessEvent(
      //       "DAILY_VISITOR_THRESHOLD_EXCEEDED",
      //       `농장 ${farm_name} 일일 방문자 ${count}명 초과`
      //     );

      //     setError(
      //       VISITOR_CONSTANTS.ERROR_MESSAGES.DAILY_LIMIT(
      //         settings.maxVisitorsPerDay
      //       )
      //     );
      //     handleError(
      //       new Error(
      //         VISITOR_CONSTANTS.ERROR_MESSAGES.DAILY_LIMIT(
      //           settings.maxVisitorsPerDay
      //         )
      //       ),
      //       "일일 방문자 수 초과"
      //     );
      //     return;
      //   }
      // }

      // 프로필 사진 업로드
      let profile_photo_url = uploadedImageUrl;
      if (formData.profilePhoto && !uploadedImageUrl) {
        try {
          const result = await uploadImage(formData.profilePhoto);
          profile_photo_url = result?.publicUrl || null;
        } catch (error) {
          setError(VISITOR_CONSTANTS.ERROR_MESSAGES.UPLOAD_FAILED);
          handleError(error as Error, "이미지 업로드에 실패했습니다");
          return;
        }
      }

      // 방문자 등록
      const response = await fetch(`/api/farms/${farmId}/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          profile_photo_url,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        handleError(
          new Error(
            data.message || VISITOR_CONSTANTS.ERROR_MESSAGES.REGISTRATION_FAILED
          ),
          "방문자 등록에 실패했습니다"
        );
        throw new Error(
          data.message || VISITOR_CONSTANTS.ERROR_MESSAGES.REGISTRATION_FAILED
        );
      }

      setIsSubmitted(true);
      setFormData(initialFormData);
      setUploadedImageUrl(null);
      handleSuccess("방문 등록 완료", "방문 등록이 성공적으로 완료되었습니다.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : VISITOR_CONSTANTS.ERROR_MESSAGES.REGISTRATION_FAILED
      );
      handleError(err as Error, "방문자 등록에 실패했습니다");
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
        maxSizeMB: 5,
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      });

      setUploadedImageUrl(result.publicUrl);
      handleSuccess(
        "이미지 업로드 완료",
        "이미지가 성공적으로 업로드되었습니다."
      );
      return result;
    } catch (error) {
      handleError(error as Error, "이미지 업로드에 실패했습니다");
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
      handleSuccess("이미지 삭제 완료", "이미지가 성공적으로 삭제되었습니다.");
    } catch (error) {
      handleError(error as Error, "이미지 삭제에 실패했습니다");
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
