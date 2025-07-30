import { useVapidKeyQuery } from "@/lib/hooks/query/use-push-mutations";

/**
 * VAPID 키를 환경변수에서 우선적으로 사용하고, 없을 때만 React Query로 조회
 * - 로딩/에러 상태, refetch 지원
 * - 키 유효성 검사 및 경고 로그
 *
 * @returns {
 *   vapidKey: string | undefined;
 *   isLoading: boolean;
 *   error: any;
 *   refetch: () => void;
 * }
 */
export function useVapidKeyEffective(): {
  vapidKey: string | undefined;
  isLoading: boolean;
  error: any;
  refetch: () => void;
} {
  // 1. 환경변수 우선
  const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  // 2. 환경변수가 없을 때만 React Query로 조회
  const {
    data: queryKey,
    isLoading,
    error,
    refetch,
  } = useVapidKeyQuery({ enabled: !envKey });

  // 3. 키 유효성 검사(예시: 너무 짧으면 경고)
  if (envKey && envKey.length < 50) {
    console.warn(
      "VAPID 환경변수 키가 너무 짧습니다. 올바른 키인지 확인하세요."
    );
  }

  return {
    vapidKey: envKey || queryKey,
    isLoading: !envKey && isLoading,
    error: !envKey ? error : undefined,
    refetch,
  };
}
