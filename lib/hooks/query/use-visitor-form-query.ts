/**
 * 방문자 폼 관련 React Query Mutations
 * 방문자 등록, 세션 체크, 농장 정보 조회 등
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { Farm as VisitorFarm } from "@/lib/types/visitor";
import { visitorsKeys, farmsKeys } from "@/lib/hooks/query/query-keys";

// 농장 정보 조회 (Query)
export const useFarmInfoQuery = (farmId: string) => {
  return useQuery({
    queryKey: farmsKeys.info(farmId),
    queryFn: async (): Promise<VisitorFarm> => {
      devLog.log(`[QUERY] 농장 정보 조회 시작: ${farmId}`);

      const result = await apiClient(`/api/farms/${farmId}`, {
        method: "GET",
        context: "농장 정보 조회",
      });

      const farmData: VisitorFarm = {
        id: result.farm.id,
        farm_name: result.farm.farm_name,
        farm_address: result.farm.farm_address,
        manager_name: result.farm.manager_name || "",
        manager_phone: result.farm.manager_phone || "",
        farm_type: result.farm.farm_type || undefined,
        owner_id: result.farm.owner_id,
      };

      return farmData;
    },
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 유지
    retry: 2,
  });
};

// 세션 체크 (Query)
export const useVisitorSessionQuery = (
  farmId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: visitorsKeys.session(farmId),
    queryFn: async () => {
      devLog.log(`[QUERY] 세션 체크 시작: ${farmId}`);

      const data = await apiClient(
        `/api/farms/${farmId}/visitors/check-session`,
        {
          method: "GET",
          context: "세션 체크",
        }
      );

      return data;
    },
    enabled: !!farmId && enabled,
    staleTime: 30 * 1000, // 30초간 fresh 유지 (세션은 자주 변경될 수 있음)
    retry: 1,
  });
};

// 일일 방문자 수 조회 (Query)
export const useDailyVisitorCountQuery = (
  farmId: string,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: visitorsKeys.dailyCount(farmId),
    queryFn: async () => {
      devLog.log(`[QUERY] 일일 방문자 수 조회: ${farmId}`);

      const data = await apiClient(
        `/api/farms/${farmId}/visitors/count-today`,
        {
          method: "GET",
          context: "일일 방문자 수 체크",
        }
      );

      return data;
    },
    enabled: !!farmId && enabled,
    staleTime: 1 * 60 * 1000, // 1분간 fresh 유지
    retry: 2,
  });
};

// 방문자 등록 (Mutation)
export const useCreateVisitorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      farmId,
      visitorData,
      profilePhotoUrl,
    }: {
      farmId: string;
      visitorData: VisitorFormData;
      profilePhotoUrl?: string | null;
    }): Promise<{ message?: string; visitor?: any }> => {
      devLog.log(`[MUTATION] 방문자 등록 시작: ${farmId}`);

      const result = await apiClient(`/api/farms/${farmId}/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...visitorData,
          profile_photo_url: profilePhotoUrl,
        }),
        context: "방문자 등록",
      });

      devLog.log(`[MUTATION] 방문자 등록 완료: ${farmId}`);
      return result;
    },
    onSuccess: (result, { farmId }) => {
      // 방문자 관련 쿼리만 무효화 (실시간 업데이트)
      queryClient.invalidateQueries({ queryKey: visitorsKeys.all });
      queryClient.invalidateQueries({ queryKey: visitorsKeys.session(farmId) });
      queryClient.invalidateQueries({
        queryKey: visitorsKeys.dailyCount(farmId),
      });
      queryClient.invalidateQueries({ queryKey: farmsKeys.info(farmId) });

      // 방문자 실시간 업데이트를 위한 Broadcast Channel
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("visitor-updates");
          channel.postMessage({
            type: "VISITOR_REGISTERED",
            farmId,
            timestamp: Date.now(),
            data: result,
          });
          channel.close();
        }
      } catch (error) {
        console.warn("방문자 실시간 업데이트 브로드캐스트 실패:", error);
      }

      devLog.log("[MUTATION] 방문자 등록 캐시 무효화 완료");
    },
  });
};
