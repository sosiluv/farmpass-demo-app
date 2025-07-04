/**
 * =================================
 * 🔔 공통 Toast 메시지 유틸리티
 * =================================
 * 중복된 toast 메시지들을 표준화하고 일관성 제공
 */

import { useToast } from "@/hooks/use-toast";

// Toast 메시지 표시 헬퍼 함수들
export function useCommonToast() {
  const { toast } = useToast();

  return {
    // 커스텀 성공 메시지
    showCustomSuccess: (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },

    // 커스텀 에러 메시지
    showCustomError: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      });
    },

    // 원본 toast 함수 (특수한 경우에만 사용)
    toast,
  };
}
