/**
 * 방문자 폼 관련 React Query Mutations
 * 방문자 등록, 세션 체크, 농장 정보 조회 등
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import type { Farm } from "@/lib/types/common";
import { visitorsKeys, farmsKeys } from "@/lib/hooks/query/query-keys";

// 농장 정보 조회 (Query)
export const useFarmInfoQuery = (farmId: string) => {
  return useQuery({
    queryKey: farmsKeys.info(farmId),
    queryFn: async (): Promise<Farm> => {
      const result = await apiClient(`/api/farms/${farmId}`, {
        method: "GET",
        context: "농장 정보 조회",
      });

      const farmData: Farm = result.farm;

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

      return result;
    },
    onSuccess: (result, { farmId }) => {
      // 모든 방문자 관련 쿼리 무효화 (기본 list + 필터링된 쿼리 모두)
      queryClient.invalidateQueries({ queryKey: visitorsKeys.all });
      // 농장 정보 무효화
      queryClient.invalidateQueries({ queryKey: farmsKeys.info(farmId) });
    },
  });
};
