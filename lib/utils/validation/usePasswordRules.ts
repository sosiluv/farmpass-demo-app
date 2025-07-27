"use client";

import { useMemo } from "react";
import { useSystemSettingsQuery } from "@/lib/hooks/query/use-system-settings-query";
import { extractPasswordRules } from "@/lib/utils/validation/validation";
import type { PasswordRules } from "@/lib/utils/validation/validation";

/**
 * 비밀번호 규칙을 가져오는 React Hook
 * SystemSettingsProvider의 캐시된 설정을 활용하여 성능 최적화
 */
export function usePasswordRules(): {
  rules: PasswordRules;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: settings, isLoading, error } = useSystemSettingsQuery();

  const rules = useMemo(() => {
    return extractPasswordRules(settings);
  }, [settings]);

  return {
    rules,
    isLoading,
    error,
  };
}
