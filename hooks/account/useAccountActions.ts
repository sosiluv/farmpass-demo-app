import { useRouter } from "next/navigation";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import type { Profile } from "@/lib/types";
import type { ChangePasswordFormData } from "@/lib/utils/validation/auth-validation";
import type { CompanyFormData } from "@/lib/utils/validation/company-validation";
import { useAccountMutations } from "@/lib/hooks/query/use-account-mutations";
import { useUnifiedImageUpload } from "@/hooks/media/useUnifiedImageUpload";
import type { ProfileFormData } from "@/lib/utils/validation/profile-validation";

interface UseAccountActionsProps {
  profile: Profile;
  userId: string | undefined;
}

interface SaveResult {
  success: boolean;
  error?: string;
  message?: string;
}

export function useAccountActions({ profile, userId }: UseAccountActionsProps) {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const accountMutations = useAccountMutations();

  // 통합 이미지 업로드 훅 사용
  const profileImageUpload = useUnifiedImageUpload({
    uploadType: "profile",
    contextId: userId, // userId를 contextId로 전달
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
    } catch (error) {
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
    } catch (error) {
      throw error;
    }
  };

  // 프로필 정보 저장 (React Query mutation 사용)
  const handleProfileSave = async (
    data: Partial<ProfileFormData>
  ): Promise<SaveResult> => {
    try {
      const result = await accountMutations.updateProfileAsync(data);
      devLog.log("프로필 정보 저장 완료");
      return { success: true, message: result.message };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  // 회사 정보 저장 (React Query mutation 사용)
  const handleCompanySave = async (
    data: Partial<CompanyFormData>
  ): Promise<SaveResult> => {
    try {
      const result = await accountMutations.updateCompanyAsync(data);
      devLog.log("회사 정보 저장 완료");
      return { success: true, message: result.message };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
    }
  };

  // 비밀번호 변경 (React Query mutation 사용)
  const handlePasswordChange = async (
    data: ChangePasswordFormData
  ): Promise<SaveResult> => {
    try {
      await accountMutations.changePasswordAsync(data);

      devLog.log("비밀번호 변경 완료");

      // 비밀번호 변경 성공 후 자동 로그아웃
      setTimeout(async () => {
        await signOut();
        router.push("/auth/login");
      }, 2000); // 2초 후 로그아웃

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      return { success: false, error: errorMessage };
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
