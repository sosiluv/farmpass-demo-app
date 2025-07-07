import { useState, useEffect } from "react";
import type { VisitorSettings } from "@/lib/types/visitor";
import { VISITOR_DEFAULTS } from "@/lib/constants/defaults";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";

export const useVisitorSettings = () => {
  const [settings, setSettings] = useState<VisitorSettings>(VISITOR_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);

        // 시스템 설정 캐싱 사용 (서버에서 이미 5분 캐싱됨)
        const systemSettings = await getSystemSettings();

        devLog.log(
          "Loaded visitor settings from system cache:",
          systemSettings
        );

        // 시스템 설정에서 방문자 설정 필드 매핑
        const mappedSettings: VisitorSettings = {
          reVisitAllowInterval: systemSettings.reVisitAllowInterval,
          maxVisitorsPerDay: systemSettings.maxVisitorsPerDay,
          visitorDataRetentionDays: systemSettings.visitorDataRetentionDays,
          requireVisitorPhoto: systemSettings.requireVisitorPhoto,
          requireVisitorContact: systemSettings.requireVisitorContact,
          requireVisitPurpose: systemSettings.requireVisitPurpose,
        };

        setSettings(mappedSettings);
        setError(null);
      } catch (err) {
        devLog.error("Failed to load visitor settings:", err);
        setError("설정을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading, error };
};
