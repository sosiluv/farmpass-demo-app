import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";

/**
 * 인증이 필요한 쿼리를 위한 커스텀 훅
 * Auth Provider와 React Query를 연동하여 자동으로 인증 상태를 확인
 */
export function useAuthenticatedQuery<TData = unknown, TError = Error>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
) {
  const { state } = useAuth();

  return useQuery({
    queryKey,
    queryFn,
    // 기본 최적화 설정
    staleTime: 5 * 60 * 1000, // 5분간 stale하지 않음
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스시 자동 refetch 안함
    ...options,
    enabled: state.status === "authenticated" && (options?.enabled ?? true),
    retry: (failureCount, error) => {
      // 인증 에러는 재시도 안함
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("Unauthorized"))
      ) {
        return false;
      }
      // 기본 재시도 로직
      return failureCount < 3;
    },
  });
}

/**
 * 인증이 필요한 뮤테이션을 위한 커스텀 훅
 */
export function useAuthenticatedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  const { state } = useAuth();

  return useMutation({
    mutationFn,
    ...options,
    retry: (failureCount, error) => {
      // 인증 에러는 재시도 안함
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("Unauthorized"))
      ) {
        return false;
      }
      // 기본 재시도 로직
      return failureCount < 1;
    },
  });
}

/**
 * API Client와 연동된 쿼리 헬퍼
 */
export function createApiQuery<TData = unknown>(
  endpoint: string,
  options?: RequestInit
) {
  return () => apiClient(endpoint, options) as Promise<TData>;
}

/**
 * 쿼리 키 생성 헬퍼
 */
export const queryKeys = {
  // 농장 관련
  farms: (userId?: string) => ["farms", userId] as const,
  farm: (farmId: string) => ["farm", farmId] as const,

  // 방문자 관련
  visitors: (farmId?: string) =>
    farmId ? (["visitors", farmId] as const) : (["visitors", "all"] as const),
  visitor: (visitorId: string) => ["visitor", visitorId] as const,

  // 농장 멤버 관련
  farmMembers: (farmId: string) => ["farmMembers", farmId] as const,

  // 알림 관련
  notifications: (userId?: string) => ["notifications", userId] as const,

  // 통계 관련
  dashboardStats: (farmId?: string) =>
    farmId
      ? (["dashboardStats", farmId] as const)
      : (["dashboardStats", "all"] as const),
  visitorStats: (farmId?: string, dateRange?: string) =>
    farmId
      ? (["visitorStats", farmId, dateRange] as const)
      : (["visitorStats", "all", dateRange] as const),
} as const;

/**
 * 사용자별 쿼리 키 생성
 */
export function createUserQueryKey(baseKey: string[], userId?: string) {
  return userId ? [...baseKey, userId] : baseKey;
}

/**
 * React Query DevTools에서 쿼리 키 가독성 향상을 위한 헬퍼
 *
 * 기존 문제:
 * - farmId가 null일 때 ["visitors", null]로 표시
 * - undefined/null 값이 DevTools에서 혼란스러움
 *
 * 개선된 방식:
 * - farmId가 없을 때 "all"로 명시적 표시
 * - ["visitors", "all"] 또는 ["visitors", "farm123"]
 */
export const createVisitorQueryKey = (farmId: string | null) => {
  if (farmId === null) {
    return ["visitors", "all"] as const;
  }
  return ["visitors", farmId] as const;
};

/**
 * 농장 쿼리 키 헬퍼 (DevTools 가독성 향상)
 */
export const createFarmQueryKey = (userId?: string) => {
  if (!userId) {
    return ["farms", "anonymous"] as const;
  }
  return ["farms", userId] as const;
};

/**
 * 농장 멤버 쿼리 키 헬퍼 (DevTools 가독성 향상)
 */
export const createFarmMemberQueryKey = (farmId: string) => {
  return ["farmMembers", farmId] as const;
};

/**
 * 대시보드 통계 쿼리 키 헬퍼 (DevTools 가독성 향상)
 */
export const createDashboardStatsQueryKey = (farmId?: string) => {
  if (!farmId) {
    return ["dashboardStats", "all"] as const;
  }
  return ["dashboardStats", farmId] as const;
};
