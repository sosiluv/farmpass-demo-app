import { getSystemSettings } from "../cache/system-settings-cache";
import { DEFAULT_SYSTEM_SETTINGS } from "../types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";

export async function getMetadataSettings() {
  try {
    const settings = await getSystemSettings();

    // 업로드된 파비콘이 있으면 해당 경로 사용, 없으면 기본 파비콘 사용
    const faviconPath = settings?.favicon
      ? `/uploads/${settings.favicon}`
      : "/favicon.png";

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
      favicon: "/favicon.png",
    };
  }
}
