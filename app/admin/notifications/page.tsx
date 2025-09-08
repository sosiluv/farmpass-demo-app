"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { WebPushSubscription } from "@/components/admin/notifications/WebPushSubscription";
import { useNotificationSettingsQuery } from "@/lib/hooks/query/use-notification-settings-query";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import {
  NotificationMethodsCard,
  NotificationTypesCard,
  NotificationSettingsActions,
  SubscriptionGuideCard,
} from "@/components/admin/notifications";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import type { UserNotificationSetting } from "@/lib/types/common";
import { FormSkeleton } from "@/components/ui/skeleton";
import { PAGE_HEADER } from "@/lib/constants/notifications";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/use-notification-store";

export default function NotificationsPage() {
  // 공통 스토어에서 isSubscribed 상태 사용
  const { isSubscribed } = useNotificationStore();

  const {
    data: settings,
    error: settingsError,
    isLoading: settingsLoading,
  } = useNotificationSettingsQuery();
  const { showError } = useCommonToast();

  // 시스템 설정 페이지처럼 로컬 상태 관리
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [localSettings, setLocalSettings] =
    useState<UserNotificationSetting | null>(null);

  // settings가 로드되면 localSettings 업데이트
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setUnsavedChanges(false);
    }
  }, [settings]);

  // 설정 변경 핸들러
  const handleSettingChange = <K extends keyof UserNotificationSetting>(
    key: K,
    value: UserNotificationSetting[K]
  ) => {
    if (!localSettings) return;

    // 로컬 상태 즉시 업데이트
    setLocalSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setUnsavedChanges(true);
  };

  // 저장 완료 후 상태 초기화
  const handleSaveComplete = () => {
    setUnsavedChanges(false);
  };

  // 알림 설정 에러 처리
  useEffect(() => {
    if (settingsError) {
      showError("알림 설정 로드 실패", settingsError.message);
    }
  }, [settingsError, showError]);

  const isLoading = settingsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          icon={Bell}
        />
        <FormSkeleton fields={5} />
      </div>
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <PageHeader
          title={PAGE_HEADER.PAGE_TITLE}
          description={PAGE_HEADER.PAGE_DESCRIPTION}
          icon={Bell}
        />

        <div className="space-y-4 md:space-y-6">
          {/* 메인 웹푸시 설정 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <WebPushSubscription />
          </motion.div>

          <AnimatePresence mode="wait">
            {!isSubscribed && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SubscriptionGuideCard />
              </motion.div>
            )}

            {isSubscribed && (
              <>
                <motion.div
                  key="methods"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotificationMethodsCard
                    settings={localSettings}
                    onSettingChange={handleSettingChange}
                  />
                </motion.div>

                <motion.div
                  key="types"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotificationTypesCard
                    settings={localSettings}
                    onSettingChange={handleSettingChange}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <NotificationSettingsActions
          hasUnsavedChanges={unsavedChanges}
          onSaveComplete={handleSaveComplete}
          currentSettings={localSettings}
        />
      </div>
    </ErrorBoundary>
  );
}
