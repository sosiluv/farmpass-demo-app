"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout";
import { WebPushSubscription } from "@/components/admin/notifications/WebPushSubscription";
import { useFarmsStore } from "@/store/use-farms-store";
import { useAuth } from "@/components/providers/auth-provider";
import { Farm } from "@/lib/types/notification";
import { ErrorBoundary } from "@/components/error/error-boundary";
import {
  NotificationMethodsCard,
  NotificationTypesCard,
  NotificationSettingsActions,
  SubscriptionGuideCard,
} from "@/components/admin/notifications";
import { useNotificationSettingsStore } from "@/store/use-notification-settings-store";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

export default function NotificationsPage() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const { farms, fetchFarms, fetchState } = useFarmsStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { setSettings } = useNotificationSettingsStore();
  const { data: settings, error: settingsError } = useNotificationSettings();
  const toast = useCommonToast();

  // 농장 데이터 로드
  useEffect(() => {
    if (user?.id && !fetchState.loading && farms.length === 0) {
      toast.showInfo("농장 정보 로딩 시작", "농장 정보를 불러오는 중입니다...");
      fetchFarms(user.id);
    }
  }, [user?.id, fetchFarms, fetchState.loading, farms.length, toast]);

  // 알림 설정 에러 처리
  useEffect(() => {
    if (settingsError) {
      toast.showCustomError(
        "알림 설정 로드 실패",
        "알림 설정을 불러오는데 실패했습니다."
      );
    }
  }, [settingsError, toast]);

  // 농장 데이터를 WebPushSubscription 컴포넌트 형식으로 변환
  const farmData: Farm[] = farms.map((farm) => ({
    id: farm.id,
    farm_name: farm.farm_name,
    address: farm.farm_address,
  }));

  useEffect(() => {
    if (settings) {
      setSettings(settings);
    }
  }, [settings, setSettings]);

  return (
    <ErrorBoundary
      title="알림 설정 오류"
      description="알림 설정 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-4 p-3 md:p-6 pt-2 md:pt-4">
        <PageHeader
          title="알림 설정"
          description="농장 관련 알림과 푸시 설정을 관리하세요"
          breadcrumbs={[{ label: "알림 설정" }]}
        />

        <div className="space-y-4 md:space-y-6">
          {/* 메인 웹푸시 설정 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <WebPushSubscription
              farms={farmData}
              onSubscriptionStatusChange={setIsSubscribed}
            />
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
                {/* TODO: 임시 비활성화 카카오톡 알림 미구현으로인해 주석처리 */}
                <motion.div
                  key="methods"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotificationMethodsCard />
                </motion.div>

                <motion.div
                  key="types"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <NotificationTypesCard />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <NotificationSettingsActions />
      </div>
    </ErrorBoundary>
  );
}
