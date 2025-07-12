"use client";

import { ProfileSection } from "./profile-section";
import { CompanySection } from "./company-section";
import { SecuritySection } from "./security-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User2, Building2, Shield } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useAccountActions } from "@/hooks/useAccountActions";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import type { Profile } from "@/lib/types";

interface AccountTabsProps {
  profile: Profile;
  userId: string;
}

export function AccountTabs({ profile, userId }: AccountTabsProps) {
  const { showInfo, showSuccess, showError } = useCommonToast();
  const {
    isLoading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  } = useAccountActions({ profile, userId });

  // 저장 핸들러들
  const handleProfileSaveWrapped = async (data: any) => {
    showInfo("프로필 저장 시작", "프로필 정보를 저장하는 중입니다...");

    try {
      const result = await handleProfileSave(data);
      if (result.success) {
        showSuccess(
          "프로필 저장 완료",
          "프로필 정보가 성공적으로 저장되었습니다."
        );
      } else {
        showError(
          "프로필 저장 실패",
          result.error || "프로필 정보 저장에 실패했습니다."
        );
      }
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      showError("프로필 저장 실패", authError.message);
    }
  };

  const handleCompanySaveWrapped = async (data: any) => {
    showInfo("회사 정보 저장 시작", "회사 정보를 저장하는 중입니다...");

    try {
      const result = await handleCompanySave(data);
      if (result.success) {
        showSuccess(
          "회사 정보 저장 완료",
          "회사 정보가 성공적으로 저장되었습니다."
        );
      } else {
        showError(
          "회사 정보 저장 실패",
          result.error || "회사 정보 저장에 실패했습니다."
        );
      }
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      showError("회사 정보 저장 실패", authError.message);
    }
  };

  const handlePasswordChangeWrapped = async (data: any) => {
    showInfo("비밀번호 변경 시작", "비밀번호를 변경하는 중입니다...");

    try {
      const result = await handlePasswordChange(data);
      if (result.success) {
        showSuccess(
          "비밀번호 변경 완료",
          "비밀번호가 성공적으로 변경되었습니다."
        );
      } else {
        showError(
          "비밀번호 변경 실패",
          result.error || "비밀번호 변경에 실패했습니다."
        );
      }
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      showError("비밀번호 변경 실패", authError.message);
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
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
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
