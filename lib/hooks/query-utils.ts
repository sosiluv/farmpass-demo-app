import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";

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
  const isAuthenticated = state.status === "authenticated";

  return useQuery({
    queryKey,
    queryFn,
    // 기본 최적화 설정
    staleTime: 5 * 60 * 1000, // 5분간 stale하지 않음
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스시 자동 refetch 안함
    ...options,
    enabled: isAuthenticated && (options?.enabled ?? true),
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
