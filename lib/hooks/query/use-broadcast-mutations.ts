"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";

interface BroadcastData {
  title: string;
  message: string;
  url: string;
  requireInteraction: boolean;
  notificationType: "maintenance" | "emergency" | "notice";
}

interface BroadcastResult {
  success: boolean;
  sentCount: number;
  totalCount: number;
  errors?: string[];
}

/**
 * 브로드캐스트 알림 전송 Mutation
 * 기본 에러 처리는 Hook 레벨에서, 추가 처리는 컴포넌트 레벨에서 가능
 */
export function useBroadcastMutation() {
  return useMutation({
    mutationFn: async (data: BroadcastData): Promise<BroadcastResult> => {
      const result = await apiClient("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        context: "브로드캐스트 알림 전송",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return result;
    },
  });
}
