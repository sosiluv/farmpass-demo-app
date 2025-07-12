import { useState } from "react";
import { useRouter } from "next/navigation";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useAuth } from "@/components/providers/auth-provider";
import type { Profile } from "@/lib/types";
import type { PasswordFormData } from "@/lib/types/account";
import { useAccountMutations } from "@/lib/hooks/query/use-account-mutations";
import { useUnifiedImageUpload } from "@/hooks/useUnifiedImageUpload";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

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

  // 통합 이미지 업로드 훅 사용
  const profileImageUpload = useUnifiedImageUpload({
    uploadType: "profile",
    userId,
    dbTable: "profiles",
    dbId: profile.id,
    dbField: "profile_image_url",
    refetchSettings: true, // settings context 즉시 갱신
    onUpdate: (data) => {
      devLog.log("프로필 이미지 DB 업데이트 완료:", data);
    },
  });

  // 이미지 업로드 함수 (통합 시스템 사용)
  const handleImageUpload = async (
    file: File | null
  ): Promise<{ publicUrl: string; fileName: string } | void> => {
    if (!file) return;

    try {
      const result = await profileImageUpload.uploadImage(file);

      if (result) {
        devLog.log("프로필 이미지 업로드 완료:", result);

        return {
          publicUrl: result.publicUrl,
          fileName: result.fileName,
        };
      }
    } catch (error: any) {
      devLog.error("프로필 이미지 업로드 실패:", error);
      throw error;
    }
  };

  // 이미지 삭제 함수 (통합 시스템 사용)
  const handleImageDelete = async (): Promise<void> => {
    try {
      devLog.log(
        `[HANDLE_IMAGE_DELETE] Starting image deletion for user: ${userId}`
      );

      await profileImageUpload.deleteImage();

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

      devLog.log("프로필 정보 저장 완료");

      return { success: true };
    } catch (error: any) {
      devLog.error("프로필 정보 저장 실패:", error);
      const authError = getAuthErrorMessage(error);
      return { success: false, error: authError.message };
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

      devLog.log("회사 정보 저장 완료");

      return { success: true };
    } catch (error: any) {
      devLog.error("회사 정보 저장 실패:", error);
      const authError = getAuthErrorMessage(error);
      return { success: false, error: authError.message };
    }
  };

  // 비밀번호 변경 (React Query mutation 사용)
  const handlePasswordChange = async (
    data: PasswordFormData
  ): Promise<SaveResult> => {
    try {
      await accountMutations.changePasswordAsync(data);

      devLog.log("비밀번호 변경 완료");

      // 비밀번호 변경 성공 후 자동 로그아웃
      setTimeout(async () => {
        await signOut();
        router.push("/login");
      }, 2000); // 2초 후 로그아웃

      return { success: true };
    } catch (error: any) {
      devLog.error("비밀번호 변경 실패:", error);
      const authError = getAuthErrorMessage(error);
      return { success: false, error: authError.message };
    }
  };

  return {
    isLoading: accountMutations.isLoading || profileImageUpload.loading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  };
}
