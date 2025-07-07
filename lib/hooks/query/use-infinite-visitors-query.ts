"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { VisitorEntry } from "@/lib/types";

interface InfiniteVisitorsParams {
  farmId?: string | null;
  searchTerm?: string;
  pageSize?: number;
}

interface VisitorsPage {
  data: VisitorEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * 무한 스크롤 방문자 데이터 조회 Hook
 * 
 * 대용량 방문자 데이터를 효율적으로 로딩하기 위한 Infinite Query 구현
 * - 페이지 단위 데이터 로딩
 * - 자동 다음 페이지 로딩
 * - 검색 및 필터링 지원
 */
export function useInfiniteVisitorsQuery({
  farmId = null,
  searchTerm = "",
  pageSize = 20
}: InfiniteVisitorsParams = {}) {
  const { state } = useAuth();
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: ["visitors", "infinite", { farmId, searchTerm, pageSize }],
    queryFn: async ({ pageParam = null }) => {
      if (state.status !== "authenticated") {
        throw new Error("인증이 필요합니다");
      }

      let query = supabase
        .from("visitor_entries")
        .select(`
          *,
          farms:farm_id (
            id,
            farm_name,
            farm_address,
            farm_type
          )
        `)
        .order("visit_datetime", { ascending: false });

      // 농장 필터
      if (farmId) {
        query = query.eq("farm_id", farmId);
      }

      // 검색 필터
      if (searchTerm) {
        query = query.or(`visitor_name.ilike.%${searchTerm}%,visitor_phone.ilike.%${searchTerm}%`);
      }

      // 페이지네이션 (커서 기반)
      if (pageParam) {
        query = query.lt("visit_datetime", pageParam);
      }

      // 페이지 크기 + 1 (다음 페이지 존재 여부 확인용)
      query = query.limit(pageSize + 1);

      const { data, error } = await query;

      if (error) {
        console.error("무한 스크롤 방문자 조회 오류:", error);
        throw new Error(error.message || "방문자 데이터를 불러오지 못했습니다.");
      }

      const visitors = data || [];
      const hasMore = visitors.length > pageSize;
      const pageData = hasMore ? visitors.slice(0, pageSize) : visitors;
      const nextCursor = hasMore ? visitors[pageSize - 1].visit_datetime : null;

      return {
        data: pageData,
        nextCursor,
        hasMore
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: state.status === "authenticated",
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

/**
 * 무한 스크롤 Hook 사용 예제
 * 
 * ```typescript
 * function VisitorsInfiniteList() {
 *   const {
 *     data,
 *     isLoading,
 *     isError,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage
 *   } = useInfiniteVisitorsQuery({
 *     farmId: selectedFarmId,
 *     searchTerm: searchValue,
 *     pageSize: 20
 *   });
 * 
 *   const allVisitors = data?.pages.flatMap(page => page.data) ?? [];
 * 
 *   return (
 *     <div>
 *       {allVisitors.map(visitor => (
 *         <VisitorCard key={visitor.id} visitor={visitor} />
 *       ))}
 *       
 *       {hasNextPage && (
 *         <button 
 *           onClick={() => fetchNextPage()}
 *           disabled={isFetchingNextPage}
 *         >
 *           {isFetchingNextPage ? '로딩 중...' : '더 보기'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
