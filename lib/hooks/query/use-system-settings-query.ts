"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { settingsKeys } from "./query-keys";
import type { SystemSettings } from "@/lib/types/settings";

// 클라이언트 전용 가드
const isClient = typeof window !== "undefined";

/**
 * React Query 기반 System Settings Hook
 * API 라우트를 통해 Prisma로 시스템 설정을 조회합니다.
 * 인증 없이도 조회 가능합니다.
 */
export function useSystemSettingsQuery() {
  const result = useQuery({
    queryKey: settingsKeys.general(),
    queryFn: async (): Promise<SystemSettings> => {
      if (!isClient) {
        throw new Error("이 함수는 클라이언트에서만 실행할 수 있습니다.");
      }

      // API 라우트를 통해 시스템 설정 조회 (Prisma 사용)
      const settings = await apiClient("/api/settings", {
        method: "GET",
        context: "시스템 설정 조회",
      });

      // API는 설정 데이터를 직접 반환함 (data.settings가 아님)
      return {
        id: settings.id,
        created_at: settings.created_at,
        updated_at: settings.updated_at,

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

        // 구독 정리 설정
        subscriptionCleanupDays: settings.subscriptionCleanupDays,
        subscriptionFailCountThreshold: settings.subscriptionFailCountThreshold,
        subscriptionCleanupInactive: settings.subscriptionCleanupInactive,
        subscriptionForceDelete: settings.subscriptionForceDelete,

        // 시스템 설정
        logLevel: settings.logLevel,
        logRetentionDays: settings.logRetentionDays,
        maintenanceMode: settings.maintenanceMode,
        debugMode: settings.debugMode,
        maintenanceContactInfo: settings.maintenanceContactInfo,
        maintenanceEstimatedTime: settings.maintenanceEstimatedTime,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceStartTime: settings.maintenanceStartTime,
      };
    },
    // 시스템 설정은 인증 없이도 조회 가능해야 함 (회원가입, 메인페이지 등에서 사용)
    enabled: isClient, // 클라이언트에서만 실행
    staleTime: 30 * 60 * 1000, // 30분간 stale하지 않음 (설정은 자주 변경되지 않음)
    gcTime: 60 * 60 * 1000, // 1시간간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false, // 마운트시 자동 refetch 안함
    refetchOnReconnect: false, // 재연결시 자동 refetch 안함
  });

  // 서버와 클라이언트 간 hydration 불일치 방지
  // 서버에서는 항상 loading: true로 시작
  if (!isClient) {
    return {
      ...result,
      isLoading: true,
      data: undefined,
    };
  }

  return result;
}
