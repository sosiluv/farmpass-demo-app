"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { useAuth } from "@/components/providers/auth-provider";
import { settingsKeys } from "./query-keys";
import type { SystemSettings } from "@/lib/types/settings";

// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";

/**
 * React Query 기반 System Settings Hook
 * API 라우트를 통해 Prisma로 시스템 설정을 조회합니다.
 */
export function useSystemSettingsQuery() {
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;

  return useAuthenticatedQuery(
    settingsKeys.general(),
    async (): Promise<SystemSettings> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // API 라우트를 통해 시스템 설정 조회 (Prisma 사용)
      const response = await fetch("/api/settings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Settings fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data) {
        throw new Error("No settings data received");
      }

      // API는 설정 데이터를 직접 반환함 (data.settings가 아님)
      const settings = data;

      // API 응답 구조에 맞게 변환
      return {
        id: settings.id,
        createdAt: new Date(settings.createdAt),
        updatedAt: new Date(settings.updatedAt),

        // 일반 설정
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        language: settings.language,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        favicon: settings.favicon,
        logo: settings.logo,

        // 보안 설정
        maxLoginAttempts: settings.maxLoginAttempts,
        accountLockoutDurationMinutes: settings.accountLockoutDurationMinutes,
        passwordMinLength: settings.passwordMinLength,
        passwordRequireSpecialChar: settings.passwordRequireSpecialChar,
        passwordRequireNumber: settings.passwordRequireNumber,
        passwordRequireUpperCase: settings.passwordRequireUpperCase,
        passwordRequireLowerCase: settings.passwordRequireLowerCase,

        // 방문자 정책
        reVisitAllowInterval: settings.reVisitAllowInterval,
        maxVisitorsPerDay: settings.maxVisitorsPerDay,
        visitorDataRetentionDays: settings.visitorDataRetentionDays,
        requireVisitorPhoto: settings.requireVisitorPhoto,
        requireVisitorContact: settings.requireVisitorContact,
        requireVisitPurpose: settings.requireVisitPurpose,

        // 알림 설정
        visitTemplate: settings.visitTemplate,

        // 웹푸시 설정
        vapidPublicKey: settings.vapidPublicKey,
        vapidPrivateKey: settings.vapidPrivateKey,
        notificationIcon: settings.notificationIcon,
        notificationBadge: settings.notificationBadge,
        pushSoundEnabled: settings.pushSoundEnabled,
        pushVibrateEnabled: settings.pushVibrateEnabled,
        pushRequireInteraction: settings.pushRequireInteraction,

        // 시스템 설정
        logLevel: settings.logLevel,
        logRetentionDays: settings.logRetentionDays,
        maintenanceMode: settings.maintenanceMode,
        debugMode: settings.debugMode,
        maintenanceContactInfo: settings.maintenanceContactInfo,
        maintenanceEstimatedTime: settings.maintenanceEstimatedTime,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceStartTime: settings.maintenanceStartTime
          ? new Date(settings.maintenanceStartTime)
          : null,
      };
    },
    {
      enabled: !!user, // 모든 인증된 사용자가 시스템 설정을 볼 수 있어야 함
      staleTime: 30 * 60 * 1000, // 30분간 stale하지 않음 (설정은 자주 변경되지 않음)
      gcTime: 60 * 60 * 1000, // 1시간간 캐시 유지
      refetchOnWindowFocus: false,
      refetchOnMount: false, // 마운트시 자동 refetch 안함
      refetchOnReconnect: false, // 재연결시 자동 refetch 안함
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
