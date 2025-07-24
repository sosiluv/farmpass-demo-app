import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useNotificationStore } from "@/store/use-notification-store";
import { useFarmsContext } from "@/components/providers/farms-provider";
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

  // farms, account_type을 가져옴
  let farms: any[] = [];
  let profile: any = undefined;
  let accountType: string | undefined = undefined;
  try {
    const ctx = useFarmsContext();
    farms = ctx.farms;
    profile = ctx.profile;
    accountType = profile?.account_type;
  } catch (e) {
    // FarmsProvider 내부 등 Context가 없을 때는 undefined로 처리 (순환 참조 방지)
    farms = [];
    profile = undefined;
    accountType = undefined;
  }

  useEffect(() => {
    const id = callbackId.current;
    callbacks.set(id, {
      table,
      refetch: () => refetchRef.current(),
      filter: filterRef.current,
    });

    if (!globalSubscribed) {
      globalSubscribed = true;
      setupGlobalSubscriptions(accountType || "", farms);
    }

    return () => {
      callbacks.delete(id);
      if (callbacks.size === 0) {
        globalSubscribed = false;
        cleanupGlobalSubscriptions();
      }
    };
  }, [table, accountType, farms]);
}

// 전역 이벤트 핸들러
function handleGlobalEvent(
  payload: any,
  targetTable: string,
  eventType: string
) {
  // 해당 테이블의 모든 콜백 실행
  callbacks.forEach((callback) => {
    if (callback.table === targetTable) {
      // 필터 적용
      if (callback.filter) {
        const shouldRefetch = callback.filter(payload.payload);
        if (!shouldRefetch) return;
      }

      callback.refetch();
    }
  });
}

// Bell 알림(Toast) 표시 함수 (window 전역 또는 커스텀 토스트 훅 활용)
function showBellNotification(title: string, message: string, extra?: any) {
  useNotificationStore.getState().addNotification({
    title,
    message,
    timestamp: Date.now(),
    ...extra,
  });
}

let channels: any[] = [];

function setupGlobalSubscriptions(accountType: string, farms: any[]) {
  // 구독 해제 후 재구독 방지
  cleanupGlobalSubscriptions();

  // 내 소속 농장 id 배열 추출
  const myFarmIds = Array.isArray(farms) ? farms.map((f) => f.id) : [];

  // 전체 채널만 구독 (farmId별 채널 구독 제거)
  channels.push(
    supabase
      .channel("farm_updates")
      .on("broadcast", { event: "farm_created" }, (payload) => {
        const farmId =
          payload.payload?.new?.id ||
          payload.payload?.new?.farm_id ||
          payload.payload?.old?.id ||
          payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "farms", "farm created");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .on("broadcast", { event: "farm_updated" }, (payload) => {
        const farmId =
          payload.payload?.new?.id ||
          payload.payload?.new?.farm_id ||
          payload.payload?.old?.id ||
          payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "farms", "farm updated");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .on("broadcast", { event: "farm_deleted" }, (payload) => {
        const farmId =
          payload.payload?.old?.id || payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "farms", "farm deleted");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .subscribe(),
    supabase
      .channel("visitor_updates")
      .on("broadcast", { event: "visitor_created" }, (payload) => {
        const farmId =
          payload.payload?.new?.farm_id || payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "visitor_entries", "visitor created");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .on("broadcast", { event: "visitor_updated" }, (payload) => {
        const farmId =
          payload.payload?.new?.farm_id || payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "visitor_entries", "visitor updated");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .on("broadcast", { event: "visitor_deleted" }, (payload) => {
        const farmId = payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "visitor_entries", "visitor deleted");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .subscribe(),
    supabase
      .channel("member_updates")
      .on("broadcast", { event: "member_created" }, (payload) => {
        const farmId =
          payload.payload?.new?.farm_id || payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "farm_members", "member created");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .on("broadcast", { event: "member_updated" }, (payload) => {
        const farmId =
          payload.payload?.new?.farm_id || payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "farm_members", "member updated");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .on("broadcast", { event: "member_deleted" }, (payload) => {
        const farmId = payload.payload?.old?.farm_id;
        if (myFarmIds.includes(farmId)) {
          handleGlobalEvent(payload, "farm_members", "member deleted");
          if (payload.payload?.title && payload.payload?.message) {
            showBellNotification(
              payload.payload.title,
              payload.payload.message
            );
          }
        }
      })
      .subscribe()
  );

  // 프로필, 시스템로그는 Postgres changes만 구독 (알림/토스트 없음)
  channels.push(
    supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          devLog.log("[postgres_changes:profiles]", payload);
          handleGlobalEvent(
            payload,
            "profiles",
            payload.eventType?.toLowerCase?.() || ""
          );
        }
      )
      .subscribe(),
    supabase
      .channel("public:system_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_logs" },
        (payload) => {
          devLog.log("[postgres_changes:system_logs]", payload);
          handleGlobalEvent(
            payload,
            "system_logs",
            payload.eventType?.toLowerCase?.() || ""
          );
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
