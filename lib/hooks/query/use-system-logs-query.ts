"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { adminKeys } from "./query-keys";
import type { SystemLog } from "@/lib/types/system";

/**
 * 시스템 로그 리스트 조회 Hook
 */
export function useSystemLogsQuery() {
  const logsQuery = useQuery({
    queryKey: adminKeys.logs.list(),
    queryFn: async (): Promise<SystemLog[]> => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000); // 최대 5000개 로그만 가져오기

      if (error) {
        throw new Error(
          `로그를 불러오는 중 오류가 발생했습니다: ${error.message}`
        );
      }

      return data || [];
    },
    staleTime: 30 * 1000, // 30초간 fresh 유지
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: true, // 창 포커스 시 자동 새로고침
    refetchOnMount: true, // 마운트 시 새로고침
  });

  return logsQuery;
}
