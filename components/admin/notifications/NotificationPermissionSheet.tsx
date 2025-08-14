"use client";

import React, { useState, useMemo } from "react";
import { Sheet, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CommonSheetContent } from "@/components/ui/sheet-common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, Users, Activity, CheckCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { BUTTONS, LABELS } from "@/lib/constants/notifications";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

interface NotificationPermissionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<void>;
  onDeny: () => void;
  farmCount?: number;
  isResubscribe?: boolean; // 재구독 여부
}

export default function NotificationPermissionSheet({
  open,
  onOpenChange,
  onAllow,
  onDeny,
  farmCount = 0,
  isResubscribe = false, // 기본값 false
}: NotificationPermissionSheetProps) {
  const [isAllowing, setIsAllowing] = useState(false);
  const { showSuccess, showError } = useCommonToast();

  // benefits 배열을 useMemo로 메모이제이션
  const benefits = useMemo(
    () => [
      {
        icon: Users,
        title: LABELS.VISITOR_NOTIFICATION,
        description: isResubscribe
          ? LABELS.VISITOR_NOTIFICATION_RESUBSCRIBE
          : LABELS.VISITOR_NOTIFICATION_DESC,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: Activity,
        title: LABELS.REAL_TIME_STATUS,
        description: isResubscribe
          ? LABELS.REAL_TIME_STATUS_RESUBSCRIBE
          : LABELS.REAL_TIME_STATUS_DESC,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: Shield,
        title: LABELS.SECURITY_NOTIFICATION,
        description: isResubscribe
          ? LABELS.SECURITY_NOTIFICATION_RESUBSCRIBE
          : LABELS.SECURITY_NOTIFICATION_DESC,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ],
    [isResubscribe] // isResubscribe 의존성 추가
  );

  const handleAllow = async () => {
    setIsAllowing(true);
    try {
      await onAllow();
      showSuccess(
        isResubscribe ? "알림 재구독 완료" : "알림 구독 완료",
        isResubscribe
          ? "알림 구독이 다시 설정되었습니다."
          : "중요한 농장 관리 알림을 받으실 수 있습니다."
      );
      onOpenChange(false);
    } catch (error) {
      devLog.error("알림 허용 처리 실패:", error);
      showError(
        "알림 구독 실패",
        error instanceof Error
          ? error.message
          : "알림 구독 중 오류가 발생했습니다."
      );
    } finally {
      setIsAllowing(false);
    }
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange(false);
  };

  const title = isResubscribe
    ? LABELS.RESUBSCRIBE_NOTIFICATIONS
    : LABELS.ALLOW_NOTIFICATIONS;

  const description = isResubscribe
    ? LABELS.RESUBSCRIBE_DESCRIPTION
    : LABELS.ALLOW_DESCRIPTION;

  return (
    <Sheet
      open={open}
      onOpenChange={(newOpen) => {
        // 빈 공간 클릭으로 닫히는 것을 완전히 방지 - 오직 버튼을 통해서만 닫을 수 있음
        if (!newOpen && isAllowing) {
          return; // 로딩 중에는 닫히지 않도록
        }
        // 빈 공간 클릭으로 닫히는 것을 완전히 방지
        if (!newOpen) {
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <CommonSheetContent
        side="bottom"
        showHandle={false}
        enableDragToClose={false}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={() => {}} // 빈 공간 클릭으로 닫히는 것을 완전히 방지
        data-notification-sheet="true"
        className="max-h-[95vh] overflow-y-auto p-0 gap-0 overflow-hidden touch-none rounded-t-[20px] rounded-b-[20px] sm:rounded-t-[24px] sm:rounded-b-[24px] border-t-2 border-primary/20 mb-4 flex flex-col mx-2 [&>button]:hidden"
      >
        {/* 접근성을 위한 숨겨진 제목과 설명 */}
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>

        <div className="relative">
          {/* 헤더 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 h-28 sm:h-36" />

          <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
            >
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </motion.div>

            <h2 className="text-base font-bold text-gray-900 mb-3 sm:mb-4">
              {title}
            </h2>

            <p className="text-sm text-gray-600 mt-3 sm:mt-4">
              {description}
              {farmCount > 0 && (
                <span className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {LABELS.FARM_COUNT_MANAGING.replace(
                      "{count}",
                      farmCount.toString()
                    )}
                  </Badge>
                </span>
              )}
            </p>
          </div>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {/* 혜택 목록 */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg ${benefit.bgColor} shrink-0`}
                  >
                    <benefit.icon
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${benefit.color}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-2">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 보안 안내 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg mb-4 sm:mb-6"
            >
              <Shield className="h-4 w-4 text-gray-500 shrink-0" />
              <p className="text-xs text-gray-600">
                {isResubscribe
                  ? LABELS.SECURITY_INFO_RESUBSCRIBE
                  : LABELS.SECURITY_INFO}
              </p>
            </motion.div>

            {/* 버튼 그룹 */}
            <div className="flex-col sm:flex-col gap-2 sm:gap-3 pt-2">
              <Button
                onClick={handleAllow}
                disabled={isAllowing}
                className="w-full sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isAllowing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mr-2"
                    >
                      <Bell className="h-4 w-4" />
                    </motion.div>
                    {BUTTONS.SETTING_NOTIFICATIONS}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isResubscribe
                      ? BUTTONS.RESUBSCRIBE_BUTTON
                      : BUTTONS.ALLOW_NOTIFICATIONS_BUTTON}
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleDeny}
                disabled={isAllowing}
                className="w-full sm:h-12 text-sm sm:text-base text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                {isResubscribe
                  ? BUTTONS.LATER_SUBSCRIBE
                  : BUTTONS.LATER_SETTINGS}
              </Button>
            </div>
          </div>
        </div>
      </CommonSheetContent>
    </Sheet>
  );
}
