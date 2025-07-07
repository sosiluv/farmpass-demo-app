"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Background Sync 및 실시간 데이터 동기화 Hook
 * 
 * - 네트워크 재연결 시 자동 동기화
 * - Supabase Realtime을 통한 실시간 업데이트
 * - 스마트 캐시 무효화
 */
export function useBackgroundSync() {
  const queryClient = useQueryClient();
  const { state } = useAuth();
  const supabase = createClient();

  // 네트워크 재연결 시 자동 refetch
  useEffect(() => {
    const handleOnline = () => {
      console.log("[BackgroundSync] 네트워크 재연결 - 데이터 동기화 시작");
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          // 인증이 필요한 쿼리만 무효화
          return query.queryKey.includes("authenticated");
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[BackgroundSync] 탭 활성화 - 데이터 동기화 시작");
        queryClient.invalidateQueries({
          predicate: (query) => {
            // 5분 이상 stale한 쿼리만 무효화
            const staleTime = 5 * 60 * 1000;
            return query.state.dataUpdatedAt < Date.now() - staleTime;
          }
        });
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);

  // Realtime 구독 설정
  useEffect(() => {
    if (state.status !== "authenticated") return;

    console.log("[BackgroundSync] Realtime 구독 시작");

    // 방문자 데이터 실시간 업데이트
    const visitorsSubscription = supabase
      .channel("visitor_entries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitor_entries",
        },
        (payload) => {
          console.log("[BackgroundSync] 방문자 데이터 변경:", payload);
          
          // 방문자 관련 쿼리 무효화
          queryClient.invalidateQueries({
            queryKey: ["visitors"]
          });
          
          // 통계 쿼리도 무효화
          queryClient.invalidateQueries({
            queryKey: ["dashboard", "stats"]
          });
        }
      )
      .subscribe();

    // 농장 데이터 실시간 업데이트
    const farmsSubscription = supabase
      .channel("farms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farms",
        },
        (payload) => {
          console.log("[BackgroundSync] 농장 데이터 변경:", payload);
          
          queryClient.invalidateQueries({
            queryKey: ["farms"]
          });
        }
      )
      .subscribe();

    // 농장 멤버 데이터 실시간 업데이트
    const membersSubscription = supabase
      .channel("farm_members")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farm_members",
        },
        (payload) => {
          console.log("[BackgroundSync] 멤버 데이터 변경:", payload);
          
          queryClient.invalidateQueries({
            queryKey: ["farm", "members"]
          });
        }
      )
      .subscribe();

    return () => {
      console.log("[BackgroundSync] Realtime 구독 정리");
      supabase.removeChannel(visitorsSubscription);
      supabase.removeChannel(farmsSubscription);
      supabase.removeChannel(membersSubscription);
    };
  }, [state.status, supabase, queryClient]);

  // 스마트 캐시 무효화 함수들
  const invalidateVisitorQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["visitors"],
      exact: false
    });
  }, [queryClient]);

  const invalidateFarmQueries = useCallback((farmId?: string) => {
    if (farmId) {
      queryClient.invalidateQueries({
        queryKey: ["farm", farmId],
        exact: false
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ["farms"],
        exact: false
      });
    }
  }, [queryClient]);

  const invalidateMemberQueries = useCallback((farmId?: string) => {
    if (farmId) {
      queryClient.invalidateQueries({
        queryKey: ["farm", farmId, "members"],
        exact: false
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ["farm", "members"],
        exact: false
      });
    }
  }, [queryClient]);

  const invalidateDashboardQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["dashboard"],
      exact: false
    });
  }, [queryClient]);

  // 전체 캐시 클리어 (로그아웃 시 사용)
  const clearAllCache = useCallback(() => {
    console.log("[BackgroundSync] 전체 캐시 클리어");
    queryClient.clear();
  }, [queryClient]);

  return {
    invalidateVisitorQueries,
    invalidateFarmQueries,
    invalidateMemberQueries,
    invalidateDashboardQueries,
    clearAllCache,
  };
}

/**
 * Cache Invalidation 전략
 * 
 * 1. **연관 데이터 자동 무효화**
 *    - 방문자 생성/수정/삭제 → 방문자 목록 + 통계 무효화
 *    - 농장 생성/수정/삭제 → 농장 목록 + 관련 방문자/멤버 무효화
 *    - 멤버 추가/제거 → 해당 농장 멤버 목록 무효화
 * 
 * 2. **실시간 동기화**
 *    - Supabase Realtime으로 다른 사용자의 변경사항 실시간 반영
 *    - 네트워크 재연결 시 자동 동기화
 *    - 탭 활성화 시 stale 데이터 갱신
 * 
 * 3. **성능 최적화**
 *    - 필요한 쿼리만 선택적 무효화
 *    - staleTime 기반 스마트 갱신
 *    - 백그라운드에서 조용한 업데이트
 * 
 * 사용 예제:
 * ```typescript
 * function useVisitorActions() {
 *   const { invalidateVisitorQueries, invalidateDashboardQueries } = useBackgroundSync();
 *   
 *   const createVisitor = useMutation({
 *     mutationFn: createVisitorAPI,
 *     onSuccess: () => {
 *       invalidateVisitorQueries();
 *       invalidateDashboardQueries();
 *     }
 *   });
 * }
 * ```
 */
