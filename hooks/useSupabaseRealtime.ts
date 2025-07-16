import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";

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
 * @param table 테이블명 ('visitor_entries', 'farms', 'farm_members')
 * @param refetch 데이터 refetch 함수 (React Query 등)
 * @param events 구독할 이벤트 타입 배열 (기본값: ['INSERT', 'UPDATE', 'DELETE'])
 * @param filter (선택) row 필터 함수(payload) => boolean
 */
export function useSupabaseRealtime({
  table,
  refetch,
  events = ["INSERT", "UPDATE", "DELETE"],
  filter,
}: {
  table: string;
  refetch: () => void;
  events?: ("INSERT" | "UPDATE" | "DELETE")[];
  filter?: (payload: any) => boolean;
}) {
  const callbackId = useRef(`${table}_${Date.now()}_${Math.random()}`);
  const refetchRef = useRef(refetch);
  const filterRef = useRef(filter);

  // 모든 참조를 업데이트 (렌더링마다)
  refetchRef.current = refetch;
  filterRef.current = filter;

  useEffect(() => {
    const id = callbackId.current;
    console.log(`🔥 [REALTIME-${table.toUpperCase()}] 콜백 등록: ${id}`);

    // 콜백 등록
    callbacks.set(id, {
      table,
      refetch: () => refetchRef.current(),
      filter: filterRef.current,
    });

    // 전역 구독이 없으면 생성
    if (!globalSubscribed) {
      globalSubscribed = true;
      console.log(`🔥 [REALTIME-GLOBAL] 전역 구독 시작`);
      setupGlobalSubscriptions();
    }

    return () => {
      console.log(`🔥 [REALTIME-${table.toUpperCase()}] 콜백 제거: ${id}`);
      callbacks.delete(id);

      // 모든 콜백이 제거되면 전역 구독도 정리
      if (callbacks.size === 0) {
        globalSubscribed = false;
        console.log(`🔥 [REALTIME-GLOBAL] 전역 구독 정리`);
        cleanupGlobalSubscriptions();
      }
    };
  }, [table]);
}

// 전역 이벤트 핸들러
function handleGlobalEvent(
  payload: any,
  targetTable: string,
  eventType: string
) {
  console.log(
    `🔥 [REALTIME-GLOBAL] ${targetTable} ${eventType} - 콜백 확인 중... (${callbacks.size}개)`
  );

  // 해당 테이블의 모든 콜백 실행
  callbacks.forEach((callback, id) => {
    if (callback.table === targetTable) {
      console.log(
        `🔥 [REALTIME-GLOBAL] ${targetTable} ${eventType} - 콜백 실행: ${id}`
      );

      // 필터 적용
      if (callback.filter) {
        const shouldRefetch = callback.filter(payload.payload);
        if (!shouldRefetch) {
          console.log(
            `🔥 [REALTIME-GLOBAL] ${targetTable} ${eventType} - 필터에서 거부됨: ${id}`
          );
          return;
        }
      }

      console.log(
        `🔥 [REALTIME-GLOBAL] ${targetTable} ${eventType} - refetch 실행: ${id}`
      );
      callback.refetch();
    }
  });
}

let channels: any[] = [];

function setupGlobalSubscriptions() {
  // 🔥 방문자 브로드캐스트 구독 (visitor_updates)
  const visitorChannel = supabase
    .channel("visitor_updates")
    .on("broadcast", { event: "visitor_inserted" }, (payload) => {
      console.log(`🔥 [REALTIME] visitor_inserted broadcast 수신:`, payload);
      handleGlobalEvent(payload, "visitor_entries", "visitor inserted");
    })
    .on("broadcast", { event: "visitor_updated" }, (payload) => {
      console.log(`🔥 [REALTIME] visitor_updated broadcast 수신:`, payload);
      handleGlobalEvent(payload, "visitor_entries", "visitor updated");
    })
    .on("broadcast", { event: "visitor_deleted" }, (payload) => {
      console.log(`🔥 [REALTIME] visitor_deleted broadcast 수신:`, payload);
      handleGlobalEvent(payload, "visitor_entries", "visitor deleted");
    })
    .subscribe((status: any, error: any) => {
      console.log(`🔥 [REALTIME] visitor_updates 구독 상태:`, {
        status,
        err: error,
      });
    });

  // 🔥 농장 브로드캐스트 구독 (farm_updates)
  const farmChannel = supabase
    .channel("farm_updates")
    .on("broadcast", { event: "farm_created" }, (payload) => {
      console.log(`🔥 [REALTIME] farm_created broadcast 수신:`, payload);
      handleGlobalEvent(payload, "farms", "farm created");
    })
    .on("broadcast", { event: "farm_updated" }, (payload) => {
      console.log(`🔥 [REALTIME] farm_updated broadcast 수신:`, payload);
      handleGlobalEvent(payload, "farms", "farm updated");
    })
    .on("broadcast", { event: "farm_deleted" }, (payload) => {
      console.log(`🔥 [REALTIME] farm_deleted broadcast 수신:`, payload);
      handleGlobalEvent(payload, "farms", "farm deleted");
    })
    .subscribe((status: any, error: any) => {
      console.log(`🔥 [REALTIME] farm_updates 구독 상태:`, {
        status,
        err: error,
      });
    });

  // 🔥 농장 멤버 브로드캐스트 구독 (member_updates)
  const memberChannel = supabase
    .channel("member_updates")
    .on("broadcast", { event: "member_created" }, (payload) => {
      console.log(`🔥 [REALTIME] member_created broadcast 수신:`, payload);
      handleGlobalEvent(payload, "farm_members", "member created");
    })
    .on("broadcast", { event: "member_updated" }, (payload) => {
      console.log(`🔥 [REALTIME] member_updated broadcast 수신:`, payload);
      handleGlobalEvent(payload, "farm_members", "member updated");
    })
    .on("broadcast", { event: "member_deleted" }, (payload) => {
      console.log(`🔥 [REALTIME] member_deleted broadcast 수신:`, payload);
      handleGlobalEvent(payload, "farm_members", "member deleted");
    })
    .subscribe((status: any, error: any) => {
      console.log(`🔥 [REALTIME] member_updates 구독 상태:`, {
        status,
        err: error,
      });
    });

  // 🔥 시스템 로그 브로드캐스트 구독 (log_updates)
  const logChannel = supabase
    .channel("log_updates")
    .on("broadcast", { event: "log_created" }, (payload) => {
      console.log(`🔥 [REALTIME] log_created broadcast 수신:`, payload);
      handleGlobalEvent(payload, "system_logs", "log created");
    })
    .on("broadcast", { event: "log_updated" }, (payload) => {
      console.log(`🔥 [REALTIME] log_updated broadcast 수신:`, payload);
      handleGlobalEvent(payload, "system_logs", "log updated");
    })
    .on("broadcast", { event: "log_deleted" }, (payload) => {
      console.log(`🔥 [REALTIME] log_deleted broadcast 수신:`, payload);
      handleGlobalEvent(payload, "system_logs", "log deleted");
    })
    .subscribe((status: any, error: any) => {
      console.log(`🔥 [REALTIME] log_updates 구독 상태:`, {
        status,
        err: error,
      });
    });

  // 🔥 사용자 프로필 브로드캐스트 구독 (profile_updates)
  const profileChannel = supabase
    .channel("profile_updates")
    .on("broadcast", { event: "profile_created" }, (payload) => {
      console.log(`🔥 [REALTIME] profile_created broadcast 수신:`, payload);
      handleGlobalEvent(payload, "profiles", "profile created");
    })
    .on("broadcast", { event: "profile_updated" }, (payload) => {
      console.log(`🔥 [REALTIME] profile_updated broadcast 수신:`, payload);
      handleGlobalEvent(payload, "profiles", "profile updated");
    })
    .on("broadcast", { event: "profile_deleted" }, (payload) => {
      console.log(`🔥 [REALTIME] profile_deleted broadcast 수신:`, payload);
      handleGlobalEvent(payload, "profiles", "profile deleted");
    })
    .subscribe((status: any, error: any) => {
      console.log(`🔥 [REALTIME] profile_updates 구독 상태:`, {
        status,
        err: error,
      });
    });

  channels = [
    visitorChannel,
    farmChannel,
    memberChannel,
    logChannel,
    profileChannel,
  ];
}

function cleanupGlobalSubscriptions() {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  channels = [];
}
