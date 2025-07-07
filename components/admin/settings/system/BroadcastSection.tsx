"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";
import SettingsCardHeader from "../SettingsCardHeader";
import { BroadcastForm, BroadcastAlert, BroadcastResult } from "./broadcast";

interface BroadcastSectionProps {
  isLoading?: boolean;
}

interface BroadcastFormData {
  title: string;
  message: string;
  requireInteraction: boolean;
  url: string;
  notificationType: "maintenance" | "emergency" | "notice";
}

export default function BroadcastSection({ isLoading }: BroadcastSectionProps) {
  const { showWarning, showInfo } = useCommonToast();
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: "",
    message: "",
    requireInteraction: false,
    url: "/admin/dashboard",
    notificationType: "notice",
  });
  const [isSending, setIsSending] = useState(false);
  const [lastSendResult, setLastSendResult] = useState<{
    success: boolean;
    sentCount: number;
    failureCount: number;
    timestamp: Date;
  } | null>(null);

  const handleInputChange = (
    field: keyof BroadcastFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendBroadcast = async () => {
    if (
      !formData.title.trim() ||
      !formData.message.trim() ||
      !formData.notificationType
    ) {
      showWarning("입력 누락", "제목, 메시지, 알림 유형을 모두 입력해주세요.");
      return;
    }

    // 긴급 알림인 경우 경고 메시지
    if (formData.notificationType === "emergency") {
      showWarning(
        "긴급 알림 발송",
        "이 알림은 모든 사용자에게 즉시 전송됩니다. 신중하게 발송해주세요."
      );
    }

    setIsSending(true);

    // 발송 시작 알림
    showInfo("알림 발송 시작", "푸시 알림을 발송하는 중입니다...");

    try {
      const result = await apiClient("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          url: formData.url,
          requireInteraction: formData.requireInteraction,
          notificationType: formData.notificationType,
        }),
        context: "푸시 알림 브로드캐스트",
        onError: (error, context) => {
          handleError(error, context);
          setLastSendResult({
            success: false,
            sentCount: 0,
            failureCount: 0,
            timestamp: new Date(),
          });

          showWarning(
            "푸시 알림 발송 실패",
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다."
          );
        },
      });

      setLastSendResult({
        success: true,
        sentCount: result.sentCount || 0,
        failureCount: result.failureCount || 0,
        timestamp: new Date(),
      });

      // 실패가 있는 경우 경고 메시지 추가
      if (result.failureCount > 0) {
        showWarning(
          "일부 발송 실패",
          `${result.sentCount}명에게 발송 성공, ${result.failureCount}명에게 발송 실패`
        );
      }

      showInfo(
        "푸시 알림 발송 완료",
        `${result.sentCount}명에게 알림을 발송했습니다.`
      );

      // 폼 초기화
      setFormData({
        title: "",
        message: "",
        requireInteraction: false,
        url: "/admin/dashboard",
        notificationType: "notice",
      });
    } catch {
      // onError에서 이미 처리함
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <SettingsCardHeader
          icon={Send}
          title="푸시 알림 브로드캐스트"
          description="모든 푸시 알림 구독자에게 메시지를 전송합니다."
        />
        <CardContent className="space-y-6">
          <BroadcastAlert />
          <BroadcastForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSendBroadcast}
            isLoading={isLoading || false}
            isSending={isSending}
          />
          <BroadcastResult lastSendResult={lastSendResult} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
