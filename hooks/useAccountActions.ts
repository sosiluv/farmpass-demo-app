import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useAuth } from "@/components/providers/auth-provider";
import {
  uploadImageUniversal,
  deleteExistingProfileImage,
} from "@/lib/utils/media/image-upload";
import type { Profile } from "@/lib/types";
import type { PasswordFormData } from "@/lib/types/account";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants/upload";

interface UseAccountActionsProps {
  profile: Profile;
  userId: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

export function useAccountActions({ profile, userId }: UseAccountActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useCommonToast();
  const router = useRouter();
  const { changePassword, refreshProfile, signOut } = useAuth();

  // 공통 에러 처리 함수
  const handleError = (error: Error, title: string) => {
    devLog.error(`${title} error:`, error);
    toast.showCustomError(title, error.message);
  };

  // 공통 성공 처리 함수
  const handleSuccess = (title: string, description: string) => {
    toast.showCustomSuccess(title, description);
  };

  // 공통 저장 로직
  const saveProfileData = async (
    data: Record<string, any>,
    actionType: string,
    successMessage: string
  ): Promise<SaveResult> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "프로필 정보 저장에 실패했습니다");
      }

      handleSuccess("저장 완료", successMessage);

      // 프로필 데이터 새로고침
      await refreshProfile();

      return { success: true };
    } catch (error) {
      handleError(error as Error, "프로필 정보 저장에 실패했습니다");
      return { success: false, error: (error as Error).message };
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (
    file: File | null
  ): Promise<{ publicUrl: string; fileName: string } | void> => {
    if (!file) return;

    try {
      setIsLoading(true);

      const result = await uploadImageUniversal({
        file,
        bucket: "profiles",
        userId,
        maxSizeMB: MAX_UPLOAD_SIZE_MB,
        allowedTypes: [...ALLOWED_IMAGE_TYPES],
      });

      const cacheBustedUrl = `${result.publicUrl}?t=${Date.now()}`;

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicUrl: result.publicUrl,
          fileName: result.fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "프로필 이미지 업로드에 실패했습니다"
        );
      }

      handleSuccess(
        "프로필 이미지 업로드 완료",
        "프로필 이미지가 성공적으로 업데이트되었습니다."
      );

      // 프로필 데이터 새로고침
      await refreshProfile();

      return { publicUrl: cacheBustedUrl, fileName: result.fileName };
    } catch (error: any) {
      handleError(error, "프로필 이미지 업로드에 실패했습니다");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 삭제 함수
  const handleImageDelete = async (): Promise<void> => {
    try {
      setIsLoading(true);
      devLog.log(
        `[HANDLE_IMAGE_DELETE] Starting image deletion for user: ${userId}`
      );

      // 1. Storage에서 기존 이미지 파일들 삭제
      await deleteExistingProfileImage(userId);
      devLog.log(`[HANDLE_IMAGE_DELETE] Storage cleanup completed`);

      // 2. 서버 API를 통해 데이터베이스에서 profile_image_url을 null로 설정
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        devLog.error(
          "[HANDLE_IMAGE_DELETE] Database update failed:",
          errorData.error
        );
        throw new Error(errorData.error || "프로필 이미지 삭제에 실패했습니다");
      }

      devLog.log(`[HANDLE_IMAGE_DELETE] Database update completed`);

      devLog.log(`[HANDLE_IMAGE_DELETE] Logging completed`);

      handleSuccess(
        "프로필 이미지 삭제 완료",
        "프로필 이미지가 성공적으로 삭제되었습니다."
      );

      // 프로필 데이터 새로고침
      await refreshProfile();

      devLog.log(`[HANDLE_IMAGE_DELETE] Image deletion completed successfully`);
    } catch (error: any) {
      devLog.error("[HANDLE_IMAGE_DELETE] Error during image deletion:", error);
      handleError(error, "프로필 이미지 삭제에 실패했습니다");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 프로필 정보 저장
  const handleProfileSave = async (data: {
    name: string;
    phoneNumber: string;
    position: string;
    department: string;
    bio: string;
  }): Promise<SaveResult> => {
    const profileData = {
      name: data.name,
      phone: data.phoneNumber,
      position: data.position,
      department: data.department,
      bio: data.bio,
    };

    return saveProfileData(
      profileData,
      "profile_info_update",
      "변경사항이 성공적으로 저장되었습니다."
    );
  };

  // 회사 정보 저장
  const handleCompanySave = async (data: {
    companyName: string;
    companyAddress: string;
    businessType: string;
    company_description: string;
    establishment_date: string;
    employee_count: string;
    company_website: string;
  }): Promise<SaveResult> => {
    const companyData = {
      company_name: data.companyName,
      company_address: data.companyAddress,
      business_type: data.businessType,
      company_description: data.company_description,
      establishment_date: data.establishment_date,
      employee_count: parseInt(data.employee_count),
      company_website: data.company_website,
    };

    return saveProfileData(
      companyData,
      "company_info_update",
      "변경사항이 성공적으로 저장되었습니다."
    );
  };

  // 비밀번호 변경
  const handlePasswordChange = async (
    data: PasswordFormData
  ): Promise<SaveResult> => {
    try {
      setIsLoading(true);

      const result = await changePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
        email: profile?.email || "",
      });

      if (!result.success) {
        throw new Error(result.error || "비밀번호 변경에 실패했습니다.");
      }

      handleSuccess(
        "비밀번호 변경 완료",
        "새로운 비밀번호로 변경되었습니다. 보안을 위해 자동으로 로그아웃됩니다."
      );

      // 비밀번호 변경 성공 후 자동 로그아웃 (로딩 상태 유지)
      setTimeout(async () => {
        await signOut();
        // 로그인 페이지로 리다이렉트
        router.push("/login");
      }, 2000); // 2초 후 로그아웃

      // 로딩 상태를 유지하여 버튼이 비활성화된 상태로 유지
      return { success: true };
    } catch (error: any) {
      handleError(error, "비밀번호 변경에 실패했습니다");
      setIsLoading(false); // 실패 시에만 로딩 상태 해제
      return { success: false, error: error.message };
    }
  };

  return {
    isLoading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  };
}
