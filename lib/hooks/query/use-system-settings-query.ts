"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { settingsKeys } from "./query-keys";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/constants/defaults";
import type { SystemSettings } from "@/lib/types/settings";

/**
 * React Query 기반 System Settings Hook
 * 기존 use-system-settings.ts를 React Query로 마이그레이션
 */
export function useSystemSettingsQuery() {
  const { state } = useAuth();

  return useAuthenticatedQuery(
    settingsKeys.general(),
    async (): Promise<SystemSettings> => {
      const { settings } = await apiClient("/api/settings", {
        method: "GET",
      });

      return settings || {
        site_name: "Farm Management",
        site_description: "농장 관리 시스템",
        contact_email: "",
        favicon: "/favicon.ico",
        logo_primary: "/default-logo1.png",
        logo_secondary: "/default-logo2.jpg",
        notification_enabled: true,
        email_notifications: true,
        push_notifications: true,
        maintenance_mode: false,
        visitor_approval_required: false,
        max_visitors_per_day: 100,
        visitor_data_retention_days: 365,
      };
    },
    {
      enabled: state.status === "authenticated",
      staleTime: 10 * 60 * 1000, // 10분 캐싱 (설정은 자주 변경되지 않음)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 인증 에러는 재시도 안함
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Unauthorized"))
        ) {
          return false;
        }
        return failureCount < 2;
      },
    }
  );
}

/**
 * 기존 Hook과의 호환성을 위한 wrapper
 */
export function useSystemSettingsQueryCompat() {
  const {
    data: settings,
    isLoading: loading,
    error,
    refetch,
  } = useSystemSettingsQuery();

  return {
    settings: settings || {
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...DEFAULT_SYSTEM_SETTINGS,
    },
    loading,
    error,
    refetch,
  };
}
