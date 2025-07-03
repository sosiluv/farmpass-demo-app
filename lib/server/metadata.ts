import { getSystemSettings } from "../cache/system-settings-cache";
import { DEFAULT_SYSTEM_SETTINGS } from "../types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createClient } from "@/lib/supabase/server";

export async function getMetadataSettings() {
  try {
    const settings = await getSystemSettings();

    let faviconPath: string;
    if (settings?.favicon) {
      if (settings.favicon.startsWith("http")) {
        faviconPath = settings.favicon;
      } else {
        faviconPath = `https://rmlgxaeugjeckllaimny.supabase.co/storage/v1/object/public/profiles/${settings.favicon}`;
      }
    } else {
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
