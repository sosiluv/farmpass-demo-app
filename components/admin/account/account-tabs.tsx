"use client";

import { ProfileSection } from "./profile-section";
import { CompanySection } from "./company-section";
import { SecuritySection } from "./security-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User2, Building2, Shield } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useAccountActions } from "@/hooks/useAccountActions";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import type { Profile } from "@/lib/types";

interface AccountTabsProps {
  profile: Profile;
  userId: string;
}

export function AccountTabs({ profile, userId }: AccountTabsProps) {
  const toast = useCommonToast();
  const {
    isLoading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  } = useAccountActions({ profile, userId });

  // Promise<SaveResult>를 Promise<void>로 래핑하고 토스트 처리
  const handleProfileSaveWrapped = async (data: any) => {
    toast.showInfo("프로필 저장 시작", "프로필 정보를 저장하는 중입니다...");
    const result = await handleProfileSave(data);
    if (result.success) {
      toast.showCustomSuccess(
        "프로필 저장 완료",
        "프로필 정보가 성공적으로 저장되었습니다."
      );
    } else {
      toast.showCustomError(
        "프로필 저장 실패",
        result.error || "프로필 정보 저장에 실패했습니다."
      );
    }
  };

  const handleCompanySaveWrapped = async (data: any) => {
    toast.showInfo("회사 정보 저장 시작", "회사 정보를 저장하는 중입니다...");
    const result = await handleCompanySave(data);
    if (result.success) {
      toast.showCustomSuccess(
        "회사 정보 저장 완료",
        "회사 정보가 성공적으로 저장되었습니다."
      );
    } else {
      toast.showCustomError(
        "회사 정보 저장 실패",
        result.error || "회사 정보 저장에 실패했습니다."
      );
    }
  };

  const handlePasswordChangeWrapped = async (data: any) => {
    toast.showInfo("비밀번호 변경 시작", "비밀번호를 변경하는 중입니다...");
    const result = await handlePasswordChange(data);
    if (result.success) {
      toast.showCustomSuccess(
        "비밀번호 변경 완료",
        "비밀번호가 성공적으로 변경되었습니다."
      );
    } else {
      toast.showCustomError(
        "비밀번호 변경 실패",
        result.error || "비밀번호 변경에 실패했습니다."
      );
    }
  };

  // 이미지 업로드/삭제 처리
  const handleImageUploadWrapped = async (file: File | null) => {
    toast.showInfo(
      "이미지 업로드 시작",
      "프로필 이미지를 업로드하는 중입니다..."
    );
    try {
      const result = await handleImageUpload(file);
      if (result) {
        toast.showCustomSuccess(
          "이미지 업로드 완료",
          "프로필 이미지가 성공적으로 업로드되었습니다."
        );
      }
      return result;
    } catch (error) {
      toast.showCustomError(
        "이미지 업로드 실패",
        "프로필 이미지 업로드에 실패했습니다."
      );
      throw error;
    }
  };

  const handleImageDeleteWrapped = async () => {
    toast.showInfo("이미지 삭제 시작", "프로필 이미지를 삭제하는 중입니다...");
    try {
      await handleImageDelete();
      toast.showCustomSuccess(
        "이미지 삭제 완료",
        "프로필 이미지가 성공적으로 삭제되었습니다."
      );
    } catch (error) {
      toast.showCustomError(
        "이미지 삭제 실패",
        "프로필 이미지 삭제에 실패했습니다."
      );
      throw error;
    }
  };

  return (
    <ErrorBoundary
      title="계정 관리 탭 오류"
      description="계정 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger
              value="profile"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <User2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                프로필
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden md:inline truncate">
                회사 정보
              </span>
              <span className="text-[10px] sm:text-xs hidden sm:inline md:hidden truncate">
                회사
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Shield className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                보안
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection
              profile={profile}
              loading={isLoading}
              onSave={handleProfileSaveWrapped}
              onImageUpload={handleImageUploadWrapped}
              onImageDelete={handleImageDeleteWrapped}
            />
          </TabsContent>

          <TabsContent value="company">
            <CompanySection
              profile={profile}
              loading={isLoading}
              onSave={handleCompanySaveWrapped}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySection
              profile={profile}
              loading={isLoading}
              onPasswordChange={handlePasswordChangeWrapped}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
