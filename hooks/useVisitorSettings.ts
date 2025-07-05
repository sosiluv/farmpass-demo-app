import { useState, useEffect, useCallback, useRef } from "react";
import type { VisitorSettings } from "@/lib/types/visitor";
import { VISITOR_CONSTANTS } from "@/lib/constants/visitor";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";

interface ApiVisitorSettings {
  visitor_revisit_interval: number;
  visitor_daily_limit: number;
  visitor_data_retention: number;
  visitor_photo_required: boolean;
  visitor_contact_required: boolean;
  visitor_purpose_required: boolean;
}

// 캐시 관리
interface SettingsCache {
  data: VisitorSettings | null;
  timestamp: number;
  ttl: number;
}

const CACHE_TTL = 60000; // 1분 캐시

export const useVisitorSettings = () => {
  const [settings, setSettings] = useState<VisitorSettings>(
    VISITOR_CONSTANTS.DEFAULT_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<SettingsCache>({
    data: null,
    timestamp: 0,
    ttl: CACHE_TTL,
  });
  const isFetchingRef = useRef(false);

  const fetchSettings = useCallback(async () => {
    const now = Date.now();

    // 캐시 확인
    if (
      cacheRef.current.data &&
      now - cacheRef.current.timestamp < cacheRef.current.ttl
    ) {
      devLog.log("Using cached visitor settings");
      setSettings(cacheRef.current.data);
      setIsLoading(false);
      return;
    }

    // 중복 요청 방지
    if (isFetchingRef.current) {
      devLog.log("Visitor settings fetch already in progress, skipping...");
      return;
    }

    try {
      isFetchingRef.current = true;

      const data = (await apiClient("/api/settings/visitor", {
        method: "GET",
        context: "방문자 설정 조회",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              setError(errorMessage);
            },
          });
        },
      })) as ApiVisitorSettings;

      devLog.log("Loaded visitor settings:", data);

      // API 응답 필드를 클라이언트 필드명으로 매핑
      const mappedSettings: VisitorSettings = {
        reVisitAllowInterval: data.visitor_revisit_interval,
        maxVisitorsPerDay: data.visitor_daily_limit,
        visitorDataRetentionDays: data.visitor_data_retention,
        requireVisitorPhoto: data.visitor_photo_required,
        requireVisitorContact: data.visitor_contact_required,
        requireVisitPurpose: data.visitor_purpose_required,
      };

      // 캐시 업데이트
      cacheRef.current = {
        data: mappedSettings,
        timestamp: now,
        ttl: CACHE_TTL,
      };

      setSettings(mappedSettings);
      setError(null);
    } catch (err) {
      // 에러는 이미 onError에서 처리됨
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, isLoading, error };
};
