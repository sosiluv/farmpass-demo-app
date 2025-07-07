"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// QueryClient 설정
function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 5분 캐싱 (staleTime)
        staleTime: 5 * 60 * 1000,
        // 10분 후 가비지 컬렉션
        gcTime: 10 * 60 * 1000,
        // 네트워크 에러 시 3번 재시도
        retry: (failureCount, error) => {
          // 인증 에러는 재시도 안함
          if (
            error?.message?.includes("401") ||
            error?.message?.includes("403")
          ) {
            return false;
          }
          return failureCount < 3;
        },
        // 네트워크 재연결 시 자동 refetch
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutation 에러 시 1번 재시도
        retry: 1,
      },
    },
  });

  // v5 권장: 글로벌 에러 처리 (이벤트 기반)
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated") {
      const query = event.query;
      const error = query.state.error;

      if (error) {
        // 글로벌 에러 처리 로직
        handleGlobalQueryError(error, query.queryKey);
      }
    }
  });

  return queryClient;
}

// 글로벌 에러 처리 함수
function handleGlobalQueryError(error: any, queryKey: readonly unknown[]) {
  // 인증 에러
  if (
    error?.message?.includes("401") ||
    error?.message?.includes("Unauthorized")
  ) {
    console.warn("� Authentication error detected:", queryKey);
    // TODO: 로그인 페이지로 리다이렉트
    return;
  }

  // 권한 에러
  if (
    error?.message?.includes("403") ||
    error?.message?.includes("Forbidden")
  ) {
    console.warn("🚫 Permission denied:", queryKey);
    // TODO: 권한 없음 토스트
    return;
  }

  // 서버 에러 (500번대)
  if (error?.message?.includes("500")) {
    console.error("🔥 Server error:", queryKey, error);
    // TODO: "서버에 문제가 발생했습니다" 토스트
    return;
  }

  // 네트워크 에러
  if (
    error?.message?.includes("네트워크") ||
    error?.message?.includes("fetch")
  ) {
    console.error("📡 Network error:", queryKey, error);
    // TODO: "네트워크 연결을 확인해주세요" 토스트
    return;
  }

  // 기타 에러는 조용히 로깅
  console.error("❌ Query error:", queryKey, error);
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // 서버에서는 매번 새로운 QueryClient 생성
    return makeQueryClient();
  } else {
    // 브라우저에서는 싱글톤 사용
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState로 QueryClient 생성하여 리렌더링 시 새로 생성되는 것을 방지
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 모드에서만 DevTools 표시 */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
