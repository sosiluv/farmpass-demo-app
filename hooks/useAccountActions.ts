import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAccountMutations } from "@/lib/hooks/query/use-account-mutations";

interface UseAccountActionsProps {
  profile: Profile;
  userId: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

export function useAccountActions({ profile, userId }: UseAccountActionsProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const accountMutations = useAccountMutations();

  // 공통 성공 처리 함수
  const handleSuccess = (title: string, description: string) => {
    devLog.log(`${title}: ${description}`);
    // 성공 로그만 기록 - 토스트는 컴포넌트에서 처리
  };

  // 이미지 업로드 함수 (React Query mutation 사용)
  const handleImageUpload = async (
    file: File | null
  ): Promise<{ publicUrl: string; fileName: string } | void> => {
    if (!file) return;

    try {
      const result = await uploadImageUniversal({
        file,
        bucket: "profiles",
        userId,
        maxSizeMB: MAX_UPLOAD_SIZE_MB,
        allowedTypes: [...ALLOWED_IMAGE_TYPES],
      });

      const cacheBustedUrl = `${result.publicUrl}?t=${Date.now()}`;

      // React Query mutation 사용
      await accountMutations.uploadImageAsync({
        publicUrl: result.publicUrl,
        fileName: result.fileName,
      });

      handleSuccess(
        "프로필 이미지 업로드 완료",
        "프로필 이미지가 성공적으로 업데이트되었습니다."
      );

      return { publicUrl: cacheBustedUrl, fileName: result.fileName };
    } catch (error: any) {
      devLog.error("프로필 이미지 업로드 실패:", error);
      throw error;
    }
  };

  // 이미지 삭제 함수 (React Query mutation 사용)
  const handleImageDelete = async (): Promise<void> => {
    try {
      devLog.log(
        `[HANDLE_IMAGE_DELETE] Starting image deletion for user: ${userId}`
      );

      // 1. Storage에서 기존 이미지 파일들 삭제
      await deleteExistingProfileImage(userId);
      devLog.log(`[HANDLE_IMAGE_DELETE] Storage cleanup completed`);

      // 2. React Query mutation 사용
      await accountMutations.deleteImageAsync();

      devLog.log(`[HANDLE_IMAGE_DELETE] Database update completed`);

      handleSuccess(
        "프로필 이미지 삭제 완료",
        "프로필 이미지가 성공적으로 삭제되었습니다."
      );

      devLog.log(`[HANDLE_IMAGE_DELETE] Image deletion completed successfully`);
    } catch (error: any) {
      devLog.error("[HANDLE_IMAGE_DELETE] Failed:", error);
      throw error;
    }
  };

  // 프로필 정보 저장 (React Query mutation 사용)
  const handleProfileSave = async (data: {
    name: string;
    phoneNumber: string;
    position: string;
    department: string;
    bio: string;
  }): Promise<SaveResult> => {
    try {
      await accountMutations.updateProfileAsync(data);
      
      handleSuccess(
        "저장 완료",
        "변경사항이 성공적으로 저장되었습니다."
      );

      return { success: true };
    } catch (error: any) {
      devLog.error("프로필 정보 저장 실패:", error);
      return { success: false, error: error.message };
    }
  };

  // 회사 정보 저장 (React Query mutation 사용)
  const handleCompanySave = async (data: {
    companyName: string;
    companyAddress: string;
    businessType: string;
    company_description: string;
    establishment_date: string;
    employee_count: string;
    company_website: string;
  }): Promise<SaveResult> => {
    try {
      await accountMutations.updateCompanyAsync(data);
      
      handleSuccess(
        "저장 완료",
        "변경사항이 성공적으로 저장되었습니다."
      );

      return { success: true };
    } catch (error: any) {
      devLog.error("회사 정보 저장 실패:", error);
      return { success: false, error: error.message };
    }
  };

  // 비밀번호 변경 (React Query mutation 사용)
  const handlePasswordChange = async (
    data: PasswordFormData
  ): Promise<SaveResult> => {
    try {
      await accountMutations.changePasswordAsync(data);

      handleSuccess(
        "비밀번호 변경 완료",
        "새로운 비밀번호로 변경되었습니다. 보안을 위해 자동으로 로그아웃됩니다."
      );

      // 비밀번호 변경 성공 후 자동 로그아웃
      setTimeout(async () => {
        await signOut();
        router.push("/login");
      }, 2000); // 2초 후 로그아웃

      return { success: true };
    } catch (error: any) {
      devLog.error("비밀번호 변경 실패:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    isLoading: accountMutations.isLoading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  };
}
