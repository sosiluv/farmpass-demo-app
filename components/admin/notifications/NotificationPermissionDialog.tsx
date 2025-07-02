"use client";

import React, { useState } from "react";
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

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<void>;
  onDeny: () => void;
  farmCount?: number;
}

export default function NotificationPermissionDialog({
  open,
  onOpenChange,
  onAllow,
  onDeny,
  farmCount = 0,
}: NotificationPermissionDialogProps) {
  const [isAllowing, setIsAllowing] = useState(false);

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

  const benefits = [
    {
      icon: Users,
      title: "방문자 알림",
      description: "새로운 방문자 등록 시 즉시 알림",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Activity,
      title: "실시간 현황",
      description: "농장 활동 및 중요 이벤트 알림",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Shield,
      title: "보안 알림",
      description: "계정 보안 및 시스템 알림",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden">
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
              알림을 허용하시겠어요?
            </DialogTitle>

            <DialogDescription className="text-sm sm:text-base text-gray-600 mt-1.5 sm:mt-2">
              농장 관리에 필요한 중요한 알림을 놓치지 마세요
              {farmCount > 0 && (
                <span className="flex items-center justify-center gap-2 mt-1.5 sm:mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {farmCount}개 농장 관리 중
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {/* 혜택 목록 */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <AnimatePresence>
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
              </AnimatePresence>
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
                알림은 중요한 농장 관리 정보만 발송되며, 언제든지 설정에서
                변경할 수 있습니다.
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
                    알림 설정 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    알림 허용하기
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
                나중에 설정하기
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
