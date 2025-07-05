import { useState, useEffect, useCallback, useMemo } from "react";
import type { NotificationSettings } from "@/lib/types/notification";
import type { SystemSettings } from "@/lib/types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data";
import { handleError } from "@/lib/utils/error";

// 알림 설정 조회 훅 (사용자용)
export function useNotificationSettings() {
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiClient("/api/notifications/settings", {
      method: "GET",
      context: "알림 설정 조회",
      onError: (error, context) => {
        if (isMounted) {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              setError(new Error(errorMessage));
            },
          });
        }
      },
    })
      .then((json) => {
        if (isMounted) {
          setData(json);
          devLog.info("알림 설정 로드 성공:", json);
        }
      })
      .catch((err) => {
        // 에러는 이미 onError에서 처리됨
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
          // 토스트는 컴포넌트에서 처리
        } catch (error) {
          handleError(error, "파일 업로드");
          // 토스트는 컴포넌트에서 처리
        } finally {
          setUploadStates((prev) => ({ ...prev, [type]: false }));
        }
      };
      input.click();
    },
    [handleImageUpload]
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
      const data = await apiClient("/api/push/vapid", {
        method: "POST",
        context: "VAPID 키 생성",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              // 에러 상태 업데이트가 필요한 경우 여기서 처리
            },
          });
        },
      });

      onUpdate("vapidPublicKey", data.publicKey);
      onUpdate("vapidPrivateKey", data.privateKey);

      // 토스트는 컴포넌트에서 처리
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    }
  }, [onUpdate]);

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
