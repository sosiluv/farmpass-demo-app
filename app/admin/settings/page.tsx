"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, UserCheck, Bell, Terminal } from "lucide-react";
import { CardSkeleton } from "@/components/common/skeletons";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { AccessDenied } from "@/components/error/access-denied";
import {
  GeneralTab,
  SecurityTab,
  VisitorTab,
  NotificationTab,
  SystemTab,
} from "@/components/admin/settings/tabs";
import { useSystemSettings } from "@/lib/hooks/use-system-settings";
import { useSystemMode } from "@/components/providers/debug-provider";
import { useAuth } from "@/components/providers/auth-provider";
import type { SystemSettings } from "@/lib/types/settings";
import {
  useSettingsImageManager,
  useSettingsValidator,
  useSettingsSaver,
  SettingsHeader,
} from "@/components/admin/settings";

export default function SettingsPage() {
  const { settings, loading, refetch } = useSystemSettings();
  const { refreshSystemModes } = useSystemMode();
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  // admin 권한 체크
  if (profile && profile.account_type !== "admin") {
    return (
      <AccessDenied
        title="시스템 설정 접근 권한이 없습니다"
        description="시스템 설정 기능은 관리자만 접근할 수 있습니다."
        requiredRole="관리자"
        currentRole="일반 사용자"
      />
    );
  }

  // settings가 로드되면 localSettings 업데이트
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // 분리된 훅들 사용
  const { handleImageUpload, handleImageDelete } = useSettingsImageManager({
    settings: localSettings,
    onSettingsUpdate: (updatedSettings) => {
      setLocalSettings((prev) => ({ ...prev, ...updatedSettings }));
    },
  });

  const { validateSetting, inputValidations } = useSettingsValidator({ user });

  const { saving, handleSaveAll } = useSettingsSaver({
    onSettingsUpdate: setLocalSettings,
    onUnsavedChangesChange: setUnsavedChanges,
    refreshSystemModes,
    refetch,
  });

  const handleSettingChange = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    // 로컬 상태 즉시 업데이트
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setUnsavedChanges(true);

    // 숫자 입력 필드에 대해서만 비동기 유효성 검사 수행
    if (key in inputValidations) {
      validateSetting(key, value).then((isValid) => {
        if (!isValid) {
          // 유효하지 않은 경우 이전 값으로 복원
          setLocalSettings((prev) => ({ ...prev, [key]: settings[key] }));
          setUnsavedChanges(false);
        }
      });
    }
  };

  const handleSave = () => {
    handleSaveAll(localSettings);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <CardSkeleton count={5} />
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="설정 페이지 오류"
      description="설정을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <SettingsHeader
          saving={saving}
          unsavedChanges={unsavedChanges}
          onSave={handleSave}
        />

        <Tabs
          defaultValue="general"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger
              value="general"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Settings className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                일반
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
            <TabsTrigger
              value="visitor"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                방문자
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Bell className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                알림
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Terminal className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                시스템
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab
              settings={localSettings}
              onSettingChange={handleSettingChange}
              onImageUpload={handleImageUpload}
              loading={saving}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab
              settings={localSettings}
              onUpdate={handleSettingChange}
              isLoading={loading}
            />
          </TabsContent>

          <TabsContent value="visitor">
            <VisitorTab
              settings={localSettings}
              onUpdate={handleSettingChange}
              isLoading={loading}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationTab
              settings={localSettings}
              onUpdate={handleSettingChange}
              isLoading={loading}
              handleImageUpload={async (file, type) => {
                await handleImageUpload(file, type as any);
              }}
              handleImageDelete={async (type) => {
                await handleImageDelete(type as any);
              }}
            />
          </TabsContent>

          <TabsContent value="system">
            <SystemTab
              settings={localSettings}
              onUpdate={handleSettingChange}
              isLoading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
