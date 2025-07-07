/**
 * =================================
 * 🔔 공통 Toast 메시지 유틸리티
 * =================================
 * 중복된 toast 메시지들을 표준화하고 일관성 제공
 */

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// Toast 메시지 표시 헬퍼 함수들
export function useCommonToast() {
  const { toast } = useToast();

  const showSuccess = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success",
    });
  }, []);

  const showError = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, []);

  const showWarning = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "warning",
    });
  }, []);

  const showInfo = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "info",
      });
    },
    [] // toast 의존성 제거
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    toast,
  };
}
