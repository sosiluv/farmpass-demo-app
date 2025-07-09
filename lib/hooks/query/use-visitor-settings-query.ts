"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-utils";
import { settingsKeys } from "@/lib/hooks/query/query-keys";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import type { VisitorSettings } from "@/lib/types/visitor";
import { VISITOR_DEFAULTS } from "@/lib/constants/defaults";

/**
 * React Query 기반 Visitor Settings Hook
 * 기존 useVisitorSettings을 React Query로 마이그레이션
 * 서버 캐싱(5분) + 클라이언트 캐싱(5분) 이중 최적화
 */
export function useVisitorSettingsQuery() {
  return useAuthenticatedQuery(
    settingsKeys.visitor(),
    async (): Promise<VisitorSettings> => {
      try {
        // 기존 서버 캐싱 로직 재사용 (5분 캐싱)
        const systemSettings = await getSystemSettings();

        // 시스템 설정에서 방문자 설정 필드 매핑 (기존 로직 유지)
        const mappedSettings: VisitorSettings = {
          reVisitAllowInterval: systemSettings.reVisitAllowInterval,
          maxVisitorsPerDay: systemSettings.maxVisitorsPerDay,
          visitorDataRetentionDays: systemSettings.visitorDataRetentionDays,
          requireVisitorPhoto: systemSettings.requireVisitorPhoto,
          requireVisitorContact: systemSettings.requireVisitorContact,
          requireVisitPurpose: systemSettings.requireVisitPurpose,
        };

        return mappedSettings;
      } catch (error) {
        console.error("Failed to load visitor settings:", error);
        // 에러 시 기본값 반환 대신 에러를 던져서 React Query가 처리하도록 함
        throw new Error("설정을 불러오는데 실패했습니다.");
      }
    },
    {
      // 5분간 클라이언트 캐싱 (서버 캐싱과 동일)
      staleTime: 5 * 60 * 1000,
      // 10분간 가비지 컬렉션 방지
      gcTime: 10 * 60 * 1000,
      // 윈도우 포커스 시 refetch 비활성화 (설정은 자주 변경되지 않음)
      refetchOnWindowFocus: false,
      // 네트워크 재연결 시 refetch
      refetchOnReconnect: true,
      // 에러 시 재시도 비활성화 (설정 조회 실패는 재시도해도 소용없음)
      retry: false,
    }
  );
}

/**
 * 기존 useVisitorSettings와 호환성을 위한 래퍼
 * 점진적 마이그레이션을 위해 기존 API 유지
 */
export function useVisitorSettings() {
  const query = useVisitorSettingsQuery();

  return {
    settings: query.data || VISITOR_DEFAULTS,
    isLoading: query.isLoading,
    error: query.error?.message || null,
  };
}
