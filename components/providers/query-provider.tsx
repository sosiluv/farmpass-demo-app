"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

// QueryClient 설정
function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 15분 캐싱 (staleTime) - 중복 호출 방지
        staleTime: 15 * 60 * 1000,
        // 30분 후 가비지 컬렉션
        gcTime: 30 * 60 * 1000,
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
        // 윈도우 포커스 시 자동 refetch 비활성화 (중복 호출 방지)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // 마운트 시 refetch 비활성화 (캐시 우선)
        refetchOnMount: false,
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
    console.warn("🔐 Authentication error detected:", queryKey);
    // 인증이 필요한 페이지에서는 로그인 페이지로 리다이렉트
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    ) {
      window.location.href = "/login";
    }
    return;
  }

  // 권한 에러
  if (
    error?.message?.includes("403") ||
    error?.message?.includes("Forbidden")
  ) {
    console.warn("🚫 Permission denied:", queryKey);
    // 권한 에러는 조용히 처리 (컴포넌트 레벨에서 처리)
    return;
  }

  // 서버 에러 (500번대)
  if (error?.message?.includes("500")) {
    console.error("🔥 Server error:", queryKey, error);
    // 서버 에러는 조용히 처리 (너무 많은 토스트 방지)
    return;
  }

  // 네트워크 에러
  if (
    error?.message?.includes("네트워크") ||
    error?.message?.includes("fetch") ||
    error?.message?.includes("Network")
  ) {
    console.error("📡 Network error:", queryKey, error);
    // 네트워크 에러는 조용히 처리 (연결 문제일 가능성)
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
