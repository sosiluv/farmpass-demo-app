"use client";

import { ProfileSection } from "./profile-section";
import { CompanySection } from "./company-section";
import { SecuritySection } from "./security-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User2, Building2, Shield } from "lucide-react";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { useAccountActions } from "@/hooks/useAccountActions";
import type { Profile } from "@/lib/types";

interface AccountTabsProps {
  profile: Profile;
  userId: string;
}

export function AccountTabs({ profile, userId }: AccountTabsProps) {
  const {
    isLoading,
    handleImageUpload,
    handleImageDelete,
    handleProfileSave,
    handleCompanySave,
    handlePasswordChange,
  } = useAccountActions({ profile, userId });

  // Promise<SaveResult>를 Promise<void>로 래핑
  const handleProfileSaveWrapped = async (data: any) => {
    await handleProfileSave(data);
  };

  const handleCompanySaveWrapped = async (data: any) => {
    await handleCompanySave(data);
  };

  const handlePasswordChangeWrapped = async (data: any) => {
    await handlePasswordChange(data);
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
