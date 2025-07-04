import { useState, useEffect, useCallback, useMemo } from "react";
import type { NotificationSettings } from "@/lib/types/notification";
import type { SystemSettings } from "@/lib/types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

// 알림 설정 조회 훅 (사용자용)
export function useNotificationSettings() {
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const toast = useCommonToast();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch("/api/notifications/settings")
      .then(async (res) => {
        if (!res.ok)
          throw new Error("알림 설정을 불러오는 중 오류가 발생했습니다.");
        const json = await res.json();
        if (isMounted) {
          setData(json);
          devLog.info("알림 설정 로드 성공:", json);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          devLog.error("알림 설정 로드 실패:", err);
          toast.showCustomError(
            "알림 설정 로드 실패",
            "알림 설정을 불러오는 중 오류가 발생했습니다."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}

// 시스템 설정용 알림 설정 훅 (시스템 관리자용)
export function useSystemNotificationSettings(options: {
  settings: SystemSettings;
  onUpdate: <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => void;
  isLoading: boolean;
  handleImageUpload: (
    file: File,
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
  handleImageDelete: (
    type: "notificationIcon" | "notificationBadge"
  ) => Promise<void>;
}) {
  const {
    settings,
    onUpdate,
    isLoading,
    handleImageUpload,
    handleImageDelete,
  } = options;
  const toast = useCommonToast();
  const [uploadStates, setUploadStates] = useState({
    icon: false,
    badge: false,
  });

  // 이미지 URL 생성
  const imageUrls = useMemo(() => {
    const timestamp = Date.now();
    return {
      icon: settings.notificationIcon
        ? `${settings.notificationIcon}?t=${timestamp}`
        : "",
      badge: settings.notificationBadge
        ? `${settings.notificationBadge}?t=${timestamp}`
        : "",
    };
  }, [settings.notificationIcon, settings.notificationBadge]);

  // 파일 선택 핸들러 (로고/파비콘과 완전히 동일하게)
  const handleFileSelect = useCallback(
    async (type: "icon" | "badge") => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setUploadStates((prev) => ({ ...prev, [type]: true }));
        try {
          // type 매핑
          const uploadType =
            type === "icon" ? "notificationIcon" : "notificationBadge";
          await handleImageUpload(file, uploadType);
          toast.showCustomSuccess(
            "파일 업로드 성공",
            `${
              type === "icon" ? "알림 아이콘" : "배지 아이콘"
            }이 업로드되었습니다.`
          );
        } catch (error) {
          devLog.error("파일 업로드 중 오류:", error);
          toast.showCustomError(
            "파일 업로드 실패",
            "파일 업로드 중 오류가 발생했습니다."
          );
        } finally {
          setUploadStates((prev) => ({ ...prev, [type]: false }));
        }
      };
      input.click();
    },
    [handleImageUpload, toast]
  );

  // 알림/배지 아이콘 제거 핸들러
  const handleRemove = useCallback(
    async (type: "icon" | "badge") => {
      const deleteType =
        type === "icon" ? "notificationIcon" : "notificationBadge";
      await handleImageDelete(deleteType);
    },
    [handleImageDelete]
  );

  // VAPID 키 생성
  const handleGenerateVapidKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/push/vapid", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("VAPID 키 생성에 실패했습니다.");
      }

      const data = await response.json();
      onUpdate("vapidPublicKey", data.publicKey);
      onUpdate("vapidPrivateKey", data.privateKey);

      toast.showCustomSuccess(
        "VAPID 키 생성 완료",
        "새로운 VAPID 키가 생성되었습니다."
      );
    } catch (error) {
      devLog.error("VAPID 키 생성 중 오류:", error);
      toast.showCustomError(
        "VAPID 키 생성 실패",
        "VAPID 키를 생성하는 중 오류가 발생했습니다."
      );
    }
  }, [onUpdate, toast]);

  // 타임스탬프 업데이트
  const updateTimestamp = useCallback((type: "icon" | "badge") => {
    // 이미지 캐시 무효화를 위한 타임스탬프 업데이트
    // 실제로는 이미지 URL이 변경되면 자동으로 처리됨
  }, []);

  return {
    uploadStates,
    imageUrls,
    handleFileSelect,
    handleRemove,
    handleGenerateVapidKeys,
    updateTimestamp,
  };
}
