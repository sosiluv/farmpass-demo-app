"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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
            error?.message?.includes("Unauthorized") ||
            error?.message?.includes("Admin access required") ||
            error?.message?.includes("Failed to verify admin status") ||
            (error as any)?.status === 401 ||
            (error as any)?.status === 403 ||
            (error as any)?.status === 500
          ) {
            return false;
          }
          return failureCount < 3;
        },
        // 기본적으로는 수동 새로고침 (성능 최적화)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
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
        console.warn("React Query Error:", {
          queryKey: query.queryKey,
          error: error.message,
        });
      }
    }
  });

  // 방문자 실시간 업데이트를 위한 Broadcast Channel 설정
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const channel = new BroadcastChannel("visitor-updates");

    channel.addEventListener("message", (event) => {
      const { type, farmId } = event.data;

      if (type === "VISITOR_REGISTERED") {
        // 방문자 관련 쿼리만 무효화 (실시간 업데이트)
        queryClient.invalidateQueries({ queryKey: ["visitors"] });
        queryClient.invalidateQueries({ queryKey: ["farm-info"] });

        // 특정 농장 방문자 관련 쿼리 무효화
        if (farmId) {
          queryClient.invalidateQueries({
            queryKey: ["visitor-session", farmId],
          });
          queryClient.invalidateQueries({
            queryKey: ["daily-visitor-count", farmId],
          });
        }
      }
    });
  }

  return queryClient;
}

// 글로벌 에러 처리 함수
function handleGlobalQueryError(error: any, queryKey: any) {
  // 개발 환경에서만 콘솔에 에러 출력
  if (process.env.NODE_ENV === "development") {
    console.error("React Query Error:", {
      error: error?.message || error,
      queryKey,
      timestamp: new Date().toISOString(),
    });
  }

  // 인증 에러는 자동으로 처리하지 않음 (AuthProvider에서 처리)
  if (
    error?.message?.includes("Unauthorized") ||
    error?.message?.includes("Admin access required")
  ) {
    return;
  }

  // 네트워크 에러는 자동 재시도되므로 별도 처리 안함
  if (error?.message?.includes("Failed to fetch")) {
    return;
  }
}

// 개발 환경에서만 DevTools 컴포넌트 생성
function DevTools() {
  const [DevToolsComponent, setDevToolsComponent] =
    useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // 개발 환경에서만 DevTools 로드
    if (process.env.NODE_ENV === "development") {
      import("@tanstack/react-query-devtools")
        .then((module) => {
          setDevToolsComponent(() => module.ReactQueryDevtools);
        })
        .catch(() => {
          // DevTools 로드 실패 시 무시
          console.warn("React Query DevTools 로드 실패");
        });
    }
  }, []);

  if (!DevToolsComponent) {
    return null;
  }

  return <DevToolsComponent initialIsOpen={false} />;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <DevTools />
    </QueryClientProvider>
  );
}
