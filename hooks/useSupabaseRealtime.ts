import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
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
    farms = [];
    profile = undefined;
    accountType = undefined;
  }

  // ✅ useAuth 훅은 여기서만 호출
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
      setupGlobalSubscriptions(accountType || "", farms, currentUserId);
    }

    return () => {
      callbacks.delete(id);
      if (callbacks.size === 0) {
        globalSubscribed = false;
        cleanupGlobalSubscriptions();
      }
    };
  }, [table, accountType, farms, currentUserId]);
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

function setupGlobalSubscriptions(
  accountType: string,
  farms: any[],
  currentUserId?: string
) {
  cleanupGlobalSubscriptions();

  const myFarmIds = Array.isArray(farms) ? farms.map((f) => f.id) : [];

  // farms 테이블 실시간 구독
  channels.push(
    supabase
      .channel("public:farms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farms" },
        (payload) => {
          const farmId =
            (payload.new && "id" in payload.new ? payload.new.id : undefined) ||
            (payload.old && "id" in payload.old ? payload.old.id : undefined);
          if (farmId && myFarmIds.includes(farmId)) {
            handleGlobalEvent(
              payload,
              "farms",
              payload.eventType?.toLowerCase?.() || ""
            );
            let action = "";
            if (payload.eventType === "INSERT") action = "등록";
            else if (payload.eventType === "UPDATE") action = "수정";
            else if (payload.eventType === "DELETE") action = "삭제";

            const farmName =
              (payload.new as any)?.farm_name ||
              (payload.old as any)?.farm_name ||
              "알 수 없음";
            showBellNotification(
              `농장 정보 ${action}`,
              `${farmName}의 정보가 ${action}되었습니다.`
            );
          }
        }
      )
      .subscribe()
  );

  // visitor_entries 테이블 실시간 구독
  channels.push(
    supabase
      .channel("public:visitor_entries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitor_entries" },
        (payload) => {
          const farmId =
            (payload.new && "farm_id" in payload.new
              ? payload.new.farm_id
              : undefined) ||
            (payload.old && "farm_id" in payload.old
              ? payload.old.farm_id
              : undefined);
          if (farmId && myFarmIds.includes(farmId)) {
            handleGlobalEvent(
              payload,
              "visitor_entries",
              payload.eventType?.toLowerCase?.() || ""
            );
            let action = "";
            if (payload.eventType === "INSERT") action = "등록";
            else if (payload.eventType === "UPDATE") action = "수정";
            else if (payload.eventType === "DELETE") action = "삭제";

            const visitorName =
              (payload.new as any)?.visitor_name ||
              (payload.old as any)?.visitor_name ||
              "알 수 없음";
            showBellNotification(
              `방문자 정보 ${action}`,
              `${visitorName}님의 정보가 ${action}되었습니다.`
            );
          }
        }
      )
      .subscribe()
  );

  // farm_members 테이블 실시간 구독
  channels.push(
    supabase
      .channel("public:farm_members")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farm_members" },
        (payload) => {
          const farmId =
            (payload.new && "farm_id" in payload.new
              ? payload.new.farm_id
              : undefined) ||
            (payload.old && "farm_id" in payload.old
              ? payload.old.farm_id
              : undefined);
          if (farmId && myFarmIds.includes(farmId)) {
            handleGlobalEvent(
              payload,
              "farm_members",
              payload.eventType?.toLowerCase?.() || ""
            );
            let action = "";
            if (payload.eventType === "INSERT") action = "등록";
            else if (payload.eventType === "UPDATE") action = "수정";
            else if (payload.eventType === "DELETE") action = "삭제";

            const memberName =
              (payload.new as any)?.member_name ||
              (payload.old as any)?.member_name ||
              "알 수 없음";
            const oldRole = (payload.old as any)?.role || "알 수 없음";
            const newRole = (payload.new as any)?.role || "알 수 없음";
            let memberMessage = `${memberName}님의 정보가 ${action}되었습니다.`;
            if (payload.eventType === "UPDATE" && oldRole !== newRole) {
              memberMessage = `${memberName}님의 역할이 ${oldRole}에서 ${newRole}로 변경되었습니다.`;
            }
            showBellNotification(`농장 멤버 ${action}`, memberMessage);
          }
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
