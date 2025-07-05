import { getSystemSettings } from "../cache/system-settings-cache";
import { DEFAULT_SYSTEM_SETTINGS } from "../types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";

export async function getMetadataSettings() {
  try {
    // 캐시를 무효화하고 최신 설정을 가져옴
    const settings = await getSystemSettings();

    let faviconPath: string;
    if (settings?.favicon && settings.favicon.trim() !== "") {
      // DB에 이미 완전한 URL이 저장되어 있음
      faviconPath = settings.favicon;
    } else {
      // 기본 파비콘 사용 (public 폴더의 favicon.ico)
      faviconPath = "/favicon.ico";
    }

    return {
      siteName: settings?.siteName || DEFAULT_SYSTEM_SETTINGS.siteName,
      siteDescription:
        settings?.siteDescription ||
        "방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.",
      favicon: faviconPath,
    };
  } catch (error) {
    devLog.error("Failed to fetch metadata settings:", error);
    return {
      siteName: DEFAULT_SYSTEM_SETTINGS.siteName,
      siteDescription: DEFAULT_SYSTEM_SETTINGS.siteDescription,
      favicon: "/favicon.ico",
    };
  }
}
