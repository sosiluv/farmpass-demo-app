import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";

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
 * Supabase 실시간 구독 훅 - 전역 브로드캐스트 방식
 * @param table 테이블명 ('visitor_entries', 'farms', 'farm_members', 'notifications')
 * @param refetch 데이터 refetch 함수 (React Query 등)
 * @param filter (선택) row 필터 함수(payload) => boolean
 * @param farms (선택) farms 데이터 - farms 테이블 구독 시 필요
 */
export function useSupabaseRealtime({
  table,
  refetch,
  filter,
  farms = [],
}: {
  table: string;
  refetch: () => void;
  filter?: (payload: any) => boolean;
  farms?: any[];
}) {
  const callbackId = useRef(`${table}_${Date.now()}_${Math.random()}`);
  const refetchRef = useRef(refetch);
  const filterRef = useRef(filter);

  // 모든 참조를 업데이트 (렌더링마다)
  refetchRef.current = refetch;
  filterRef.current = filter;

  // farms 데이터를 직접 가져오기 (Context 사용 안함)
  const { state } = useAuth();
  const currentUserId =
    state.status === "authenticated" ? state.user.id : undefined;

  useEffect(() => {
    const id = callbackId.current;
    callbacks.set(id, {
      table,
      refetch: () => refetchRef.current(),
      filter: filterRef.current,
    });

    if (!globalSubscribed) {
      globalSubscribed = true;
      setupGlobalSubscriptions(farms, currentUserId);
    }

    return () => {
      callbacks.delete(id);
      if (callbacks.size === 0) {
        globalSubscribed = false;
        cleanupGlobalSubscriptions();
      }
    };
  }, [table, farms, currentUserId]);
}

// 전역 이벤트 핸들러
function handleGlobalEvent(payload: any, targetTable: string) {
  // 해당 테이블의 모든 콜백 실행
  callbacks.forEach((callback) => {
    if (callback.table === targetTable) {
      // 필터 적용
      if (callback.filter) {
        const shouldRefetch = callback.filter(payload);
        if (!shouldRefetch) return;
      }

      callback.refetch();
    }
  });
}

let channels: any[] = [];

function setupGlobalSubscriptions(farms: any[], currentUserId?: string) {
  cleanupGlobalSubscriptions();

  const myFarmIds = Array.isArray(farms) ? farms.map((f) => f.id) : [];

  // farms 테이블 실시간 구독
  if (myFarmIds.length > 0) {
    channels.push(
      supabase
        .channel("public:farms")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "farms",
            filter: `id=in.(${myFarmIds.join(",")})`,
          },
          (payload) => {
            handleGlobalEvent(payload, "farms");
          }
        )
        .subscribe()
    );
  }

  // visitor_entries 테이블 실시간 구독
  if (myFarmIds.length > 0) {
    channels.push(
      supabase
        .channel("public:visitor_entries")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "visitor_entries",
            filter: `farm_id=in.(${myFarmIds.join(",")})`,
          },
          (payload) => {
            handleGlobalEvent(payload, "visitor_entries");
          }
        )
        .subscribe()
    );
  }

  // farm_members 테이블 실시간 구독
  if (myFarmIds.length > 0) {
    channels.push(
      supabase
        .channel("public:farm_members")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "farm_members",
            filter: `farm_id=in.(${myFarmIds.join(",")})`,
          },
          (payload) => {
            handleGlobalEvent(payload, "farm_members");
          }
        )
        .subscribe()
    );
  }

  // notifications 테이블 실시간 구독 추가
  if (currentUserId) {
    channels.push(
      supabase
        .channel("public:notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            // notifications 테이블의 모든 콜백 실행 (React Query refetch)
            handleGlobalEvent(payload, "notifications");
          }
        )
        .subscribe()
    );
  }
}

function cleanupGlobalSubscriptions() {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  channels = [];
}
