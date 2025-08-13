"use client";

import { ProfileSection } from "./profile-section";
import { CompanySection } from "./company-section";
import { SecuritySection } from "./security-section";
import { PrivacySection } from "./privacy-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User2, Building2, Shield, FileText } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { LABELS } from "@/lib/constants/account";
import { useAccountActions } from "@/hooks/account/useAccountActions";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import type { Profile } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";

interface AccountTabsProps {
  profile: Profile;
}

export function AccountTabs({ profile }: AccountTabsProps) {
  const { showInfo, showSuccess, showError } = useCommonToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useAuth();
  const isAuthenticated = state.status === "authenticated";
  const userId = isAuthenticated ? state.user.id : undefined;
  const defaultTab = searchParams.get("tab") || "profile";

  // 소셜 로그인 사용자 감지
  const socialUserInfo = useMemo(() => {
    if (isAuthenticated && state.user) {
      const provider = state.user.app_metadata?.provider;
      return {
        isSocialUser: provider && provider !== "email",
        socialProvider: provider || "",
        allProviders: provider ? [provider] : [],
        socialProviders: provider && provider !== "email" ? [provider] : [],
      };
    }
    return {
      isSocialUser: false,
      socialProvider: "",
      allProviders: [],
      socialProviders: [],
    };
  }, [state]) as {
    isSocialUser: boolean;
    socialProvider: string;
    allProviders: string[];
    socialProviders: string[];
  };

  const {
    isLoading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  } = useAccountActions({ profile, userId });

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("tab", value);
      router.push(`/admin/account?${params.toString()}`);
    },
    [searchParams, router]
  );

  // 저장 핸들러들
  const handleProfileSaveWrapped = async (data: any) => {
    showInfo("프로필 저장 시작", "프로필 정보를 저장하는 중입니다...");

    try {
      const result = await handleProfileSave(data);
      if (result.success) {
        showSuccess(
          "프로필 저장 완료",
          result.message || "프로필 정보가 성공적으로 저장되었습니다."
        );
      } else {
        showError(
          "프로필 저장 실패",
          result.message || "프로필 정보 저장에 실패했습니다."
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("프로필 저장 실패", errorMessage);
    }
  };

  const handleCompanySaveWrapped = async (data: any) => {
    showInfo("회사 정보 저장 시작", "회사 정보를 저장하는 중입니다...");

    try {
      const result = await handleCompanySave(data);
      if (result.success) {
        showSuccess(
          "회사 정보 저장 완료",
          result.message || "회사 정보가 성공적으로 저장되었습니다."
        );
      } else {
        showError(
          "회사 정보 저장 실패",
          result.message || "회사 정보 저장에 실패했습니다."
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("회사 정보 저장 실패", errorMessage);
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("비밀번호 변경 실패", errorMessage);
    }
  };

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="space-y-6">
        <Tabs
          value={defaultTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger
              value="profile"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <User2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                {LABELS.TABS.PROFILE}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden md:inline truncate">
                {LABELS.TABS.COMPANY}
              </span>
              <span className="text-[10px] sm:text-xs hidden sm:inline md:hidden truncate">
                {LABELS.COMPANY_NAME}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Shield className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                {LABELS.TABS.SECURITY}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                {LABELS.TABS.PRIVACY}
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
              socialUserInfo={socialUserInfo}
            />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySection userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
