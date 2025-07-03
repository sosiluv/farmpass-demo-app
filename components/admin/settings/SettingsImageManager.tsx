import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useEffect, useRef } from "react";
import { useUniversalImageManager } from "@/hooks/useUniversalImageManager";
import { supabase } from "@/lib/supabase/client";
import type { SystemSettings } from "@/lib/types/settings";

interface SettingsImageManagerProps {
  settings: SystemSettings;
  onSettingsUpdate: (updatedSettings: Partial<SystemSettings>) => void;
}

function getLogoFileName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const timestamp = Date.now();
  return `systems/logo_${timestamp}.${ext}`;
}
function getFaviconFileName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "ico";
  const timestamp = Date.now();
  return `systems/favicon_${timestamp}.${ext}`;
}
function getNotificationIconFileName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const timestamp = Date.now();
  return `systems/notification_icon_${timestamp}.${ext}`;
}
function getNotificationBadgeFileName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const timestamp = Date.now();
  return `systems/notification_badge_${timestamp}.${ext}`;
}

export function useSettingsImageManager({
  settings,
  onSettingsUpdate,
}: SettingsImageManagerProps) {
  const { showCustomSuccess, showCustomError } = useCommonToast();
  const faviconLinkRef = useRef<HTMLLinkElement | null>(null);

  // 시스템 설정 강제 새로고침
  const refreshSettings = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .single();
    if (!error && data) {
      onSettingsUpdate(data);
    }
  };

  // 파비콘 즉시 업데이트 함수
  const updateFaviconInBrowser = (faviconUrl: string | null) => {
    if (typeof window === "undefined") return;

    devLog.log(`[FAVICON] Updating favicon in browser: ${faviconUrl}`);

    // 기존 모든 <link rel="icon"> 제거
    document.querySelectorAll('link[rel="icon"]').forEach((link) => {
      devLog.log(`[FAVICON] Removing existing favicon link:`, link);
      link.remove();
    });

    if (faviconUrl) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = faviconUrl;
      link.type = faviconUrl.endsWith(".ico") ? "image/x-icon" : "image/png";
      document.head.appendChild(link);
      faviconLinkRef.current = link;
      devLog.log(`[FAVICON] Added new favicon link:`, link.href);
    } else {
      // 기본 파비콘으로 복원 (ico 우선, 없으면 png)
      const defaultIco = "/favicon.ico";
      const link = document.createElement("link");
      link.rel = "icon";
      // ico 우선, 없으면 png
      link.href = defaultIco;
      link.type = "image/x-icon";
      document.head.appendChild(link);
      faviconLinkRef.current = link;
      devLog.log(`[FAVICON] Restored default favicon`);
    }
  };

  useEffect(() => {
    // row가 없으면 자동 생성 (최초 1회)
    if (!settings?.id) {
      supabase
        .from("system_settings")
        .insert({})
        .select()
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            onSettingsUpdate(data);
          }
        });
    }

    // 페이지 로드 시 현재 설정된 파비콘 적용
    if (settings?.favicon) {
      devLog.log(
        `[FAVICON] Page load: applying favicon from settings: ${settings.favicon}`
      );
      updateFaviconInBrowser(settings.favicon);
    }

    return () => {
      if (faviconLinkRef.current && faviconLinkRef.current.parentNode) {
        try {
          faviconLinkRef.current.parentNode.removeChild(faviconLinkRef.current);
        } catch (error) {}
        faviconLinkRef.current = null;
      }
    };
  }, [settings?.favicon]); // settings.favicon이 변경될 때마다 실행

  // 공통 훅 인스턴스화 (로고)
  const logoManager = useUniversalImageManager({
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "logo",
    storageBucket: "profiles",
    storagePath: getLogoFileName,
    allowedTypes: ["image/png", "image/jpeg", "image/svg+xml"],
    cacheBusterField: "logoCacheBuster",
    onUpdate: (updated) => {
      onSettingsUpdate(updated);
    },
    // 기존 logo_* 파일 모두 삭제 (업로드 전)
    preUploadCleanup: async () => {
      const { data: files } = await supabase.storage
        .from("profiles")
        .list("systems");
      const logoFiles =
        files
          ?.filter((f) => f.name.startsWith("logo_"))
          ?.map((f) => `systems/${f.name}`) ?? [];
      if (logoFiles.length > 0) {
        await supabase.storage.from("profiles").remove(logoFiles);
      }
    },
  });

  // 공통 훅 인스턴스화 (파비콘)
  const faviconManager = useUniversalImageManager({
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "favicon",
    storageBucket: "profiles",
    storagePath: getFaviconFileName,
    allowedTypes: ["image/png", "image/x-icon"],
    cacheBusterField: "faviconCacheBuster",
    onUpdate: (updated) => {
      onSettingsUpdate(updated);
    },
    // 기존 favicon_* 파일 모두 삭제 (업로드 전)
    preUploadCleanup: async () => {
      const { data: files } = await supabase.storage
        .from("profiles")
        .list("systems");
      const faviconFiles =
        files
          ?.filter((f) => f.name.startsWith("favicon_"))
          ?.map((f) => `systems/${f.name}`) ?? [];
      if (faviconFiles.length > 0) {
        await supabase.storage.from("profiles").remove(faviconFiles);
      }
    },
  });

  // 공통 훅 인스턴스화 (알림 아이콘)
  const notificationIconManager = useUniversalImageManager({
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "notificationIcon",
    storageBucket: "profiles",
    storagePath: getNotificationIconFileName,
    allowedTypes: ["image/png", "image/svg+xml", "image/jpeg"],
    cacheBusterField: "notificationIconCacheBuster",
    onUpdate: (updated) => {
      onSettingsUpdate(updated);
    },
    preUploadCleanup: async () => {
      const { data: files } = await supabase.storage
        .from("profiles")
        .list("systems");
      const iconFiles =
        files
          ?.filter((f) => f.name.startsWith("notification_icon_"))
          ?.map((f) => `systems/${f.name}`) ?? [];
      if (iconFiles.length > 0) {
        await supabase.storage.from("profiles").remove(iconFiles);
      }
    },
  });

  // 공통 훅 인스턴스화 (배지 아이콘)
  const notificationBadgeManager = useUniversalImageManager({
    dbTable: "system_settings",
    dbId: settings.id,
    dbField: "notificationBadge",
    storageBucket: "profiles",
    storagePath: getNotificationBadgeFileName,
    allowedTypes: ["image/png", "image/svg+xml", "image/jpeg"],
    cacheBusterField: "notificationBadgeCacheBuster",
    onUpdate: (updated) => {
      onSettingsUpdate(updated);
    },
    preUploadCleanup: async () => {
      const { data: files } = await supabase.storage
        .from("profiles")
        .list("systems");
      const badgeFiles =
        files
          ?.filter((f) => f.name.startsWith("notification_badge_"))
          ?.map((f) => `systems/${f.name}`) ?? [];
      if (badgeFiles.length > 0) {
        await supabase.storage.from("profiles").remove(badgeFiles);
      }
    },
  });

  // 핸들러: 타입에 따라 분기
  const handleImageUpload = async (
    file: File | null,
    type: "favicon" | "logo" | "notificationIcon" | "notificationBadge"
  ) => {
    if (!settings?.id) {
      showCustomError("설정 오류", "시스템 설정 정보가 올바르지 않습니다.");
      return;
    }
    if (!file) {
      await handleImageDelete(type);
      return;
    }
    try {
      if (type === "logo") {
        const result = await logoManager.handleImageUpload(file);
        await refreshSettings();
        if (result?.publicUrl) {
          showCustomSuccess("로고 업로드 완료", "로고가 업로드되었습니다.");
        }
      } else if (type === "favicon") {
        const result = await faviconManager.handleImageUpload(file);
        await refreshSettings();
        if (result?.publicUrl) {
          updateFaviconInBrowser(result.publicUrl);
          showCustomSuccess("파비콘 업로드 완료", "파비콘이 업로드되었습니다.");
        }
      } else if (type === "notificationIcon") {
        const result = await notificationIconManager.handleImageUpload(file);
        await refreshSettings();
        if (result?.publicUrl) {
          showCustomSuccess(
            "알림 아이콘 업로드 완료",
            "알림 아이콘이 업로드되었습니다."
          );
          return { url: result.publicUrl, path: result.publicUrl };
        }
      } else if (type === "notificationBadge") {
        const result = await notificationBadgeManager.handleImageUpload(file);
        await refreshSettings();
        if (result?.publicUrl) {
          showCustomSuccess(
            "배지 아이콘 업로드 완료",
            "배지 아이콘이 업로드되었습니다."
          );
          return { url: result.publicUrl, path: result.publicUrl };
        }
      }
    } catch (error) {
      let message = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof (error as any).message === "string") {
          message = (error as any).message;
        } else if (
          "error" in error &&
          typeof (error as any).error === "string"
        ) {
          message = (error as any).error;
        } else {
          message = JSON.stringify(error);
        }
      } else if (typeof error === "string") {
        message = error;
      }
      showCustomError("이미지 업로드 실패", message);
    }
  };

  const handleImageDelete = async (
    type: "favicon" | "logo" | "notificationIcon" | "notificationBadge"
  ) => {
    if (!settings?.id) {
      showCustomError("설정 오류", "시스템 설정 정보가 올바르지 않습니다.");
      return;
    }
    try {
      if (type === "logo") {
        await logoManager.handleImageDelete();
        await refreshSettings();
        showCustomSuccess("로고 삭제 완료", "로고가 삭제되었습니다.");
      } else if (type === "favicon") {
        await faviconManager.handleImageDelete();
        await refreshSettings();
        updateFaviconInBrowser(null);
        showCustomSuccess("파비콘 삭제 완료", "파비콘이 삭제되었습니다.");
      } else if (type === "notificationIcon") {
        await notificationIconManager.handleImageDelete();
        await refreshSettings();
        showCustomSuccess(
          "알림 아이콘 삭제 완료",
          "알림 아이콘이 삭제되었습니다."
        );
      } else if (type === "notificationBadge") {
        await notificationBadgeManager.handleImageDelete();
        await refreshSettings();
        showCustomSuccess(
          "배지 아이콘 삭제 완료",
          "배지 아이콘이 삭제되었습니다."
        );
      }
    } catch (error) {
      let message = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof (error as any).message === "string") {
          message = (error as any).message;
        } else if (
          "error" in error &&
          typeof (error as any).error === "string"
        ) {
          message = (error as any).error;
        } else {
          message = JSON.stringify(error);
        }
      } else if (typeof error === "string") {
        message = error;
      }
      showCustomError("이미지 삭제 실패", message);
    }
  };

  return {
    handleImageUpload,
    handleImageDelete,
    updateFaviconInBrowser,
  };
}
