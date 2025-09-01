import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

// 전역 구독 상태 관리
let globalSubscribed = false;
const callbacks = new Map<
  string,
  {
    table: string;
    refetch: () => void;
    filter?: (payload: any) => boolean;
  }
>();

/**
 * Supabase 실시간 구독 훅 - RLS 기반 자동 필터링
 * @param table 테이블명 ('visitor_entries', 'farms', 'farm_members', 'notifications')
 * @param refetch 데이터 refetch 함수 (React Query 등)
 * @param filter (선택) 추가 클라이언트 사이드 필터 함수(payload) => boolean
 */
export function useSupabaseRealtime({
  table,
  refetch,
  filter,
}: {
  table: string;
  refetch: () => void;
  filter?: (payload: any) => boolean;
}) {
  const callbackId = useRef(`${table}_${Date.now()}_${Math.random()}`);
  const refetchRef = useRef(refetch);
  const filterRef = useRef(filter);

  // 모든 참조를 업데이트 (렌더링마다)
  refetchRef.current = refetch;
  filterRef.current = filter;

  // RLS 정책으로 인해 userId나 farms 정보 불필요

  useEffect(() => {
    const id = callbackId.current;

    // 필터가 false를 반환하면 콜백을 등록하지 않음
    if (filterRef.current && filterRef.current({}) === false) {
      return;
    }

    callbacks.set(id, {
      table,
      refetch: () => refetchRef.current(),
      filter: filterRef.current,
    });

    if (!globalSubscribed) {
      globalSubscribed = true;
      setupGlobalSubscriptions();
    }

    return () => {
      callbacks.delete(id);
      if (callbacks.size === 0) {
        globalSubscribed = false;
        cleanupGlobalSubscriptions();
      }
    };
  }, [table]);
}

// 전역 이벤트 핸들러
function handleGlobalEvent(payload: any, targetTable: string) {
  // 해당 테이블의 모든 콜백 실행
  let refetchCount = 0;
  callbacks.forEach((callback) => {
    if (callback.table === targetTable) {
      // 필터 적용
      if (callback.filter) {
        const shouldRefetch = callback.filter(payload);
        if (!shouldRefetch) return;
      }

      callback.refetch();
      refetchCount++;
    }
  });
}

let channels: any[] = [];

function setupGlobalSubscriptions() {
  cleanupGlobalSubscriptions();

  // farms 테이블 실시간 구독 (RLS 정책으로 자동 필터링)
  channels.push(
    supabase
      .channel("public:farms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farms",
        },
        (payload) => {
          handleGlobalEvent(payload, "farms");
        }
      )
      .subscribe()
  );

  // visitor_entries 테이블 실시간 구독 (RLS 정책으로 자동 필터링)
  channels.push(
    supabase
      .channel("public:visitor_entries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitor_entries",
        },
        (payload) => {
          handleGlobalEvent(payload, "visitor_entries");
        }
      )
      .subscribe()
  );

  // farm_members 테이블 실시간 구독 (RLS 정책으로 자동 필터링)
  channels.push(
    supabase
      .channel("public:farm_members")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farm_members",
        },
        (payload) => {
          handleGlobalEvent(payload, "farm_members");
        }
      )
      .subscribe()
  );

  // notifications 테이블 실시간 구독 (RLS 정책으로 자동 필터링)
  channels.push(
    supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // notifications 테이블의 모든 콜백 실행 (React Query refetch)
          handleGlobalEvent(payload, "notifications");
        }
      )
      .subscribe()
  );
}

function cleanupGlobalSubscriptions() {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  channels = [];
}
