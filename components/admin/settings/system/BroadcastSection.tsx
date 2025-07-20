"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useBroadcastMutation } from "@/lib/hooks/query/use-broadcast-mutations";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import SettingsCardHeader from "../SettingsCardHeader";
import { BroadcastForm, BroadcastAlert, BroadcastResult } from "./broadcast";
import { PAGE_HEADER } from "@/lib/constants/settings";

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
  const { showWarning, showInfo, showSuccess, showError } = useCommonToast();
  const broadcastMutation = useBroadcastMutation();

  const [formData, setFormData] = useState<BroadcastFormData>({
    title: "",
    message: "",
    requireInteraction: false,
    url: "/admin/dashboard",
    notificationType: "notice",
  });
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

    // 발송 시작 알림
    showInfo("알림 발송 시작", "푸시 알림을 발송하는 중입니다...");

    try {
      const result = await broadcastMutation.mutateAsync({
        title: formData.title,
        message: formData.message,
        url: formData.url,
        requireInteraction: formData.requireInteraction,
        notificationType: formData.notificationType,
      });

      // 성공 처리 - API의 message를 그대로 사용
      if (result.success) {
        showSuccess(
          "브로드캐스트 완료",
          result.message ||
            `총 ${result.totalCount}명 중 ${result.sentCount}명에게 알림을 전송했습니다.`
        );
      } else {
        showError(
          "브로드캐스트 실패",
          result.message ||
            `알림 전송에 실패했습니다. ${result.errors?.join(", ") || ""}`
        );
      }

      setLastSendResult({
        success: result.success,
        sentCount: result.sentCount,
        failureCount: result.totalCount - result.sentCount,
        timestamp: new Date(),
      });

      // 폼 초기화
      setFormData({
        title: "",
        message: "",
        requireInteraction: false,
        url: "/admin/dashboard",
        notificationType: "notice",
      });
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      showError("브로드캐스트 오류", authError.message);

      setLastSendResult({
        success: false,
        sentCount: 0,
        failureCount: 0,
        timestamp: new Date(),
      });
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
          title={PAGE_HEADER.BROADCAST_SECTION_TITLE}
          description={PAGE_HEADER.BROADCAST_SECTION_DESC}
        />
        <CardContent className="space-y-6">
          <BroadcastAlert />
          <BroadcastForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSendBroadcast}
            isLoading={isLoading || false}
            isSending={broadcastMutation.isPending}
          />
          <BroadcastResult lastSendResult={lastSendResult} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
