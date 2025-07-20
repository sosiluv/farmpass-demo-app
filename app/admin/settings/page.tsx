"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useSystemSettingsContext } from "@/components/providers/system-settings-provider";
import { useDynamicFavicon } from "@/hooks/use-dynamic-favicon";
import { useSystemMode } from "@/components/providers/debug-provider";
import { useAuth } from "@/components/providers/auth-provider";
import type { SystemSettings } from "@/lib/types/settings";
import {
  useSettingsValidator,
  useSettingsSaver,
  SettingsHeader,
} from "@/components/admin/settings";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { LABELS } from "@/lib/constants/settings";

export default function SettingsPage() {
  const { settings, isLoading: loading, refetch } = useSystemSettingsContext();

  // 설정 페이지에서만 동적 파비콘 업데이트 (기본 파비콘 포함)
  useDynamicFavicon(settings?.favicon || "/favicon.ico");

  const { refreshSystemModes } = useSystemMode();
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const profile = state.status === "authenticated" ? state.profile : null;

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(
    null
  );

  // settings가 로드되면 localSettings 업데이트
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const { validateSetting, inputValidations } = useSettingsValidator({ user });

  const { saving, handleSaveAll } = useSettingsSaver({
    onSettingsUpdate: setLocalSettings,
    onUnsavedChangesChange: setUnsavedChanges,
    refreshSystemModes,
    refetch: async () => {
      refetch();
      return settings;
    },
  });

  // 설정이 로딩 중이거나 localSettings가 없으면 로딩 표시
  if (loading || !localSettings) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <SettingsHeader
          saving={false}
          unsavedChanges={false}
          onSave={() => {}}
        />
        <CardSkeleton count={5} />
      </div>
    );
  }

  // admin 권한 체크
  if (profile && profile.account_type !== "admin") {
    return (
      <AccessDenied
        title={ERROR_CONFIGS.PERMISSION.title}
        description={ERROR_CONFIGS.PERMISSION.description}
        requiredRole="관리자"
        currentRole="일반 사용자"
      />
    );
  }

  const handleSettingChange = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    if (!localSettings) return;

    // 로컬 상태 즉시 업데이트
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setUnsavedChanges(true);

    // 숫자 입력 필드에 대해서만 비동기 유효성 검사 수행
    if (key in inputValidations) {
      validateSetting(key, value).then((isValid) => {
        if (!isValid && settings) {
          // 유효하지 않은 경우 이전 값으로 복원
          setLocalSettings((prev) =>
            prev ? { ...prev, [key]: settings[key] } : prev
          );
          setUnsavedChanges(false);
        }
      });
    }
  };

  const handleSave = () => {
    if (localSettings) {
      handleSaveAll(localSettings);
    }
  };

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
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
                {LABELS.TABS.GENERAL}
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
              value="visitor"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                {LABELS.TABS.VISITOR}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Bell className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                {LABELS.TABS.NOTIFICATIONS}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex flex-col items-center justify-center gap-0.5 p-1 sm:p-1.5 md:p-2 min-w-0"
            >
              <Terminal className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs hidden sm:inline truncate">
                {LABELS.TABS.SYSTEM}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab
              settings={localSettings}
              onSettingChange={handleSettingChange}
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
