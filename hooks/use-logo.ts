"use client";

import { useSystemSettings } from "@/lib/hooks/use-system-settings";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/constants/defaults";
import { useMemo } from "react";

interface LogoInfo {
  logoUrl: string | null;
  siteName: string;
  hasLogo: boolean;
}

/**
 * 시스템 로고 정보를 가져오는 훅
 * 업로드된 로고가 있으면 해당 URL을, 없으면 null을 반환
 */
export function useLogo(): LogoInfo {
  const { settings } = useSystemSettings();

  const imageUrl = useMemo(() => {
    if (!settings?.logo) return null;
    // 캐시 버스터를 설정의 updatedAt을 기반으로 생성하여 설정 변경 시에만 새로고침
    const cacheBuster = settings.updatedAt
      ? new Date(settings.updatedAt).getTime()
      : Date.now();
    // DB에 저장된 publicUrl을 그대로 사용
    return `${settings.logo}?t=${cacheBuster}`;
  }, [settings?.logo, settings?.updatedAt]);

  return {
    logoUrl: imageUrl,
    siteName: settings?.siteName || DEFAULT_SYSTEM_SETTINGS.siteName,
    hasLogo: !!settings?.logo,
  };
}
