"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";

interface ResetAttemptsRequest {
  email: string;
  reason: string;
}

/**
 * 계정 로그인 시도 횟수 리셋 Mutation
 * 기본 에러 처리는 Hook 레벨에서, 추가 처리는 컴포넌트 레벨에서 가능
 */
export function useResetLoginAttemptsMutation() {
  return useMutation({
    mutationFn: async (data: ResetAttemptsRequest) => {
      const result = await apiClient("/api/auth/reset-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        context: "로그인 시도 횟수 리셋",
      });
      return result;
    },
  });
}
