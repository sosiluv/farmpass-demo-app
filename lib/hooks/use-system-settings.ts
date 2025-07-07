import useSWR from "swr";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { SystemSettings } from "@/lib/types/settings";
import { DEFAULT_SYSTEM_SETTINGS } from "@/lib/constants/defaults";
import { handleError } from "@/lib/utils/error";

const fetcher = async (url: string): Promise<SystemSettings> => {
  devLog.log("[useSystemSettings] Settings API 호출:", url);

  // 현재 origin을 기반으로 절대 URL 생성
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${baseUrl}${url}`;

  const data = await apiClient(fullUrl, {
    headers: {
      "Cache-Control": "no-cache", // 캐시된 응답을 사용하지 않도록
    },
    context: "시스템 설정 조회",
    onError: (error, context) => {
      handleError(error, context);
    },
  });

  devLog.log("[useSystemSettings] Settings API 응답 완료");

  return {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...data,
    id: data.id || "",
    createdAt: new Date(data.createdAt || Date.now()),
    updatedAt: new Date(data.updatedAt || Date.now()),
  };
};

export function useSystemSettings() {
  const {
    data: settings,
    error,
    mutate,
  } = useSWR<SystemSettings>("/api/settings", fetcher, {
    revalidateOnFocus: false, // 포커스시 재검증 비활성화 (중복 호출 방지)
    revalidateOnReconnect: false, // 재연결시 재검증 비활성화
    refreshInterval: 0, // 자동 재검증 비활성화
    dedupingInterval: 10000, // 10초 내 중복 요청 방지 (증가)
    errorRetryCount: 1, // 오류 시 재시도 횟수 제한 (감소)
    errorRetryInterval: 5000, // 재시도 간격 5초 (증가)
  });

  // 즉시 캐시 무효화 함수
  const invalidateCache = async () => {
    try {
      await apiClient("/api/settings/invalidate-cache", {
        method: "POST",
        context: "시스템 설정 캐시 무효화",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              devLog.error("Failed to invalidate cache:", errorMessage);
            },
          });
        },
      });
      await mutate(); // SWR 캐시도 무효화
    } catch (error) {
      // 에러는 이미 onError에서 처리됨
    }
  };

  return {
    settings: settings || {
      ...DEFAULT_SYSTEM_SETTINGS,
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    loading: !settings && !error,
    error,
    refetch: () => mutate(),
    invalidateCache,
  };
}
