import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
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
    ...options,
    enabled: state.status === "authenticated" && (options?.enabled ?? true),
    retry: (failureCount, error) => {
      // 인증 에러는 재시도 안함
      if (error instanceof Error && (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Unauthorized")
      )) {
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
export function useAuthenticatedMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  const { state } = useAuth();

  return useMutation({
    mutationFn,
    ...options,
    retry: (failureCount, error) => {
      // 인증 에러는 재시도 안함
      if (error instanceof Error && (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Unauthorized")
      )) {
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
  visitors: (farmId?: string) => ["visitors", farmId] as const,
  visitor: (visitorId: string) => ["visitor", visitorId] as const,
  
  // 농장 멤버 관련
  farmMembers: (farmId: string) => ["farmMembers", farmId] as const,
  
  // 알림 관련
  notifications: (userId?: string) => ["notifications", userId] as const,
  
  // 통계 관련
  dashboardStats: (farmId?: string) => ["dashboardStats", farmId] as const,
  visitorStats: (farmId?: string, dateRange?: string) => 
    ["visitorStats", farmId, dateRange] as const,
} as const;

/**
 * 사용자별 쿼리 키 생성
 */
export function createUserQueryKey(baseKey: string[], userId?: string) {
  return userId ? [...baseKey, userId] : baseKey;
}
