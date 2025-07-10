/**
 * 방문자 폼 관련 React Query Mutations
 * 방문자 등록, 세션 체크, 농장 정보 조회 등
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { Farm as VisitorFarm } from "@/lib/types/visitor";

// 농장 정보 조회 (Query)
export const useFarmInfoQuery = (farmId: string) => {
  return useQuery({
    queryKey: ["farm-info", farmId],
    queryFn: async (): Promise<VisitorFarm> => {
      devLog.log(`[QUERY] 농장 정보 조회 시작: ${farmId}`);

      const result = await apiClient(`/api/farms/${farmId}`, {
        method: "GET",
        context: "농장 정보 조회",
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              devLog.error("농장 정보 조회 실패:", errorMessage);
            },
          });
        },
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
    queryKey: ["visitor-session", farmId],
    queryFn: async () => {
      devLog.log(`[QUERY] 세션 체크 시작: ${farmId}`);

      const data = await apiClient(
        `/api/farms/${farmId}/visitors/check-session`,
        {
          method: "GET",
          context: "세션 체크",
          onError: (error, context) => {
            handleError(error, {
              context,
              onStateUpdate: (errorMessage) => {
                devLog.error("세션 체크 실패:", errorMessage);
              },
            });
          },
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
    queryKey: ["daily-visitor-count", farmId],
    queryFn: async () => {
      devLog.log(`[QUERY] 일일 방문자 수 조회: ${farmId}`);

      const data = await apiClient(
        `/api/farms/${farmId}/visitors/count-today`,
        {
          method: "GET",
          context: "일일 방문자 수 체크",
          onError: (error, context) => {
            handleError(error, {
              context,
              onStateUpdate: (errorMessage) => {
                devLog.error("일일 방문자 수 조회 실패:", errorMessage);
              },
            });
          },
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
    }) => {
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
        onError: (error, context) => {
          handleError(error, {
            context,
            onStateUpdate: (errorMessage) => {
              devLog.error("방문자 등록 실패:", errorMessage);
            },
          });
        },
      });

      devLog.log(`[MUTATION] 방문자 등록 완료: ${farmId}`);
      return result;
    },
    onSuccess: (_, { farmId }) => {
      // 관련 쿼리들 무효화
      queryClient.invalidateQueries({ queryKey: ["visitors"] });
      queryClient.invalidateQueries({ queryKey: ["visitor-session", farmId] });
      queryClient.invalidateQueries({
        queryKey: ["daily-visitor-count", farmId],
      });
      queryClient.invalidateQueries({ queryKey: ["farm-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

      devLog.log("[MUTATION] 방문자 등록 관련 캐시 무효화 완료");
    },
    onError: (error, { farmId, visitorData }) => {
      devLog.error("[MUTATION] 방문자 등록 실패:", error);
    },
  });
};
