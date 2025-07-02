import useSWR from "swr";
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from "@/lib/types/settings";
import { devLog } from "@/lib/utils/logging/dev-logger";

const fetcher = async (url: string): Promise<SystemSettings> => {
  devLog.log("[useSystemSettings] Settings API 호출:", url);

  // 현재 origin을 기반으로 절대 URL 생성
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    headers: {
      "Cache-Control": "no-cache", // 캐시된 응답을 사용하지 않도록
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  const data = await response.json();

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
    revalidateOnFocus: false, // 포커스시 재검증 비활성화
    revalidateOnReconnect: false, // 재연결시 재검증 비활성화
    refreshInterval: 300000, // 5분마다 자동 재검증
    dedupingInterval: 10000, // 10초 내 중복 요청 방지 (5초에서 10초로 증가)
    errorRetryCount: 2, // 오류 시 재시도 횟수 제한
    errorRetryInterval: 3000, // 재시도 간격 3초
  });

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
  };
}
