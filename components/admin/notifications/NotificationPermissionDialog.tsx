"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, Users, Activity, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { BUTTONS, LABELS } from "@/lib/constants/notifications";

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<void>;
  onDeny: () => void;
  farmCount?: number;
  isResubscribe?: boolean; // 재구독 여부
}

export default function NotificationPermissionDialog({
  open,
  onOpenChange,
  onAllow,
  onDeny,
  farmCount = 0,
  isResubscribe = false, // 기본값 false
}: NotificationPermissionDialogProps) {
  const [isAllowing, setIsAllowing] = useState(false);

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
    } catch (error) {
      devLog.error("알림 허용 처리 실패:", error);
    } finally {
      setIsAllowing(false);
    }
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[480px] w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden"
        data-notification-dialog="true"
      >
        <div className="relative">
          {/* 헤더 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 h-28 sm:h-32" />

          <DialogHeader className="relative p-4 sm:p-6 pb-3 sm:pb-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg"
            >
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </motion.div>

            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              {isResubscribe
                ? LABELS.RESUBSCRIBE_NOTIFICATIONS
                : LABELS.ALLOW_NOTIFICATIONS}
            </DialogTitle>

            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1.5 sm:mt-2">
              {isResubscribe
                ? LABELS.RESUBSCRIBE_DESCRIPTION
                : LABELS.ALLOW_DESCRIPTION}
              {farmCount > 0 && (
                <span className="flex items-center justify-center gap-2 mt-1.5 sm:mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {LABELS.FARM_COUNT_MANAGING.replace(
                      "{count}",
                      farmCount.toString()
                    )}
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

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
                    <p className="text-xs text-gray-600 mt-0.5">
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
            <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-3 pt-2">
              <Button
                onClick={handleAllow}
                disabled={isAllowing}
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
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
                className="w-full h-9 sm:h-10 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                {isResubscribe
                  ? BUTTONS.LATER_SUBSCRIBE
                  : BUTTONS.LATER_SETTINGS}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
