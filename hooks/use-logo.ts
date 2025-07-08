"use client";

import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/constants/defaults";
import { useMemo } from "react";
import type { SystemSettings } from "@/lib/types/settings";

interface LogoInfo {
  logoUrl: string | null;
  siteName: string;
  hasLogo: boolean;
}

/**
 * 시스템 로고 정보를 가져오는 훅
 * 업로드된 로고가 있으면 해당 URL을, 없으면 null을 반환
 * settings는 상위 컴포넌트에서 prop으로 전달받음
 */
export function useLogo(settings?: SystemSettings | null): LogoInfo {
  // settings가 undefined인 경우 기본값 사용
  const currentSettings = settings || {
    ...DEFAULT_SYSTEM_SETTINGS,
    id: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const imageUrl = useMemo(() => {
    if (!currentSettings?.logo) return null;
    // 캐시 버스터를 설정의 updatedAt을 기반으로 생성하여 설정 변경 시에만 새로고침
    const cacheBuster = currentSettings.updatedAt
      ? new Date(currentSettings.updatedAt).getTime()
      : Date.now();
    // DB에 저장된 publicUrl을 그대로 사용
    return `${currentSettings.logo}?t=${cacheBuster}`;
  }, [currentSettings?.logo, currentSettings?.updatedAt]);

  return {
    logoUrl: imageUrl,
    siteName: currentSettings?.siteName || DEFAULT_SYSTEM_SETTINGS.siteName,
    hasLogo: !!currentSettings?.logo,
  };
}
