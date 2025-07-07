"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  createVisitorQueryKey,
  createDashboardStatsQueryKey,
} from "@/lib/hooks/query-utils";
import type { VisitorEntry } from "@/lib/types";

export interface CreateVisitorRequest {
  farm_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
  visitor_purpose?: string;
  disinfection_check: boolean;
  consent_given: boolean;
  visit_datetime?: string;
}

export interface UpdateVisitorRequest extends Partial<CreateVisitorRequest> {
  id: string;
}

/**
 * Optimistic Update를 적용한 방문자 생성 Mutation Hook
 */
export function useCreateVisitorOptimisticMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useCommonToast();

  return useMutation({
    mutationFn: async (data: CreateVisitorRequest): Promise<VisitorEntry> => {
      const response = await apiClient("/api/visitors", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.visitor;
    },
    onMutate: async (newVisitor) => {
      // 1. 진행 중인 refetch 취소
      await queryClient.cancelQueries({
        queryKey: createVisitorQueryKey(newVisitor.farm_id),
      });
      await queryClient.cancelQueries({
        queryKey: createVisitorQueryKey(null),
      });

      // 2. 이전 데이터 스냅샷 저장
      const previousFarmVisitors = queryClient.getQueryData(
        createVisitorQueryKey(newVisitor.farm_id)
      );
      const previousAllVisitors = queryClient.getQueryData(
        createVisitorQueryKey(null)
      );

      // 3. 임시 ID와 타임스탬프 생성
      const tempId = `temp-${Date.now()}`;
      const tempVisitor: VisitorEntry = {
        id: tempId,
        farm_id: newVisitor.farm_id,
        visitor_name: newVisitor.visitor_name,
        visitor_phone: newVisitor.visitor_phone,
        visitor_address: newVisitor.visitor_address,
        visitor_purpose: newVisitor.visitor_purpose || null,
        disinfection_check: newVisitor.disinfection_check,
        consent_given: newVisitor.consent_given,
        visit_datetime: newVisitor.visit_datetime || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        registered_by: null,
        notes: null,
        vehicle_number: null,
        session_token: `temp-${Date.now()}`,
        profile_photo_url: null,
      };

      // 4. 캐시에 낙관적 업데이트 적용
      queryClient.setQueryData(
        createVisitorQueryKey(newVisitor.farm_id),
        (old: VisitorEntry[] | undefined) => {
          return old ? [tempVisitor, ...old] : [tempVisitor];
        }
      );

      queryClient.setQueryData(
        createVisitorQueryKey(null),
        (old: VisitorEntry[] | undefined) => {
          return old ? [tempVisitor, ...old] : [tempVisitor];
        }
      );

      // 5. 롤백을 위한 컨텍스트 반환
      return {
        previousFarmVisitors,
        previousAllVisitors,
        tempId,
        farmId: newVisitor.farm_id,
      };
    },
    onError: (error, newVisitor, context) => {
      // 에러 발생 시 이전 데이터로 롤백
      if (context?.previousFarmVisitors) {
        queryClient.setQueryData(
          createVisitorQueryKey(context.farmId),
          context.previousFarmVisitors
        );
      }
      if (context?.previousAllVisitors) {
        queryClient.setQueryData(
          createVisitorQueryKey(null),
          context.previousAllVisitors
        );
      }

      showError(
        "방문자 등록 실패",
        error.message || "방문자 등록 중 오류가 발생했습니다."
      );
    },
    onSuccess: (actualVisitor, variables, context) => {
      // 성공 시 임시 데이터를 실제 데이터로 교체
      queryClient.setQueryData(
        createVisitorQueryKey(variables.farm_id),
        (old: VisitorEntry[] | undefined) => {
          if (!old) return [actualVisitor];
          return old.map((visitor) =>
            visitor.id === context?.tempId ? actualVisitor : visitor
          );
        }
      );

      queryClient.setQueryData(
        createVisitorQueryKey(null),
        (old: VisitorEntry[] | undefined) => {
          if (!old) return [actualVisitor];
          return old.map((visitor) =>
            visitor.id === context?.tempId ? actualVisitor : visitor
          );
        }
      );

      showSuccess(
        "방문자 등록 완료",
        `${actualVisitor.visitor_name}님이 등록되었습니다.`
      );
    },
    onSettled: (data, error, variables, context) => {
      // 완료 후 관련 쿼리 다시 페치하여 최신 상태 보장
      queryClient.invalidateQueries({
        queryKey: createVisitorQueryKey(variables.farm_id),
      });
      queryClient.invalidateQueries({ queryKey: createVisitorQueryKey(null) });
      queryClient.invalidateQueries({
        queryKey: createDashboardStatsQueryKey(variables.farm_id),
      });
    },
  });
}

/**
 * Optimistic Update를 적용한 방문자 삭제 Mutation Hook
 */
export function useDeleteVisitorOptimisticMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useCommonToast();

  return useMutation({
    mutationFn: async (
      visitorId: string
    ): Promise<{ success: boolean; visitor?: VisitorEntry }> => {
      const response = await apiClient(`/api/visitors/${visitorId}`, {
        method: "DELETE",
      });
      return response;
    },
    onMutate: async (visitorId) => {
      // 1. 진행 중인 refetch 취소
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === "visitors",
      });

      // 2. 이전 데이터 스냅샷 저장
      const previousData = new Map();
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query) => {
          if (query.queryKey[0] === "visitors") {
            previousData.set(query.queryKey.join(","), query.state.data);
          }
        });

      // 3. 삭제될 방문자 찾기
      let deletedVisitor: VisitorEntry | undefined;
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query) => {
          if (query.queryKey[0] === "visitors") {
            const data = query.state.data as VisitorEntry[];
            if (data) {
              const found = data.find((v) => v.id === visitorId);
              if (found) {
                deletedVisitor = found;
              }
            }
          }
        });

      // 4. 캐시에서 낙관적으로 방문자 제거
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query) => {
          if (query.queryKey[0] === "visitors") {
            queryClient.setQueryData(
              query.queryKey,
              (old: VisitorEntry[] | undefined) => {
                return old
                  ? old.filter((visitor) => visitor.id !== visitorId)
                  : [];
              }
            );
          }
        });

      // 5. 롤백을 위한 컨텍스트 반환
      return {
        previousData,
        deletedVisitor,
      };
    },
    onError: (error, visitorId, context) => {
      // 에러 발생 시 이전 데이터로 롤백
      if (context?.previousData) {
        context.previousData.forEach((data, key) => {
          const queryKey = key.split(",");
          queryClient.setQueryData(queryKey, data);
        });
      }

      showError(
        "방문자 삭제 실패",
        error.message || "방문자 삭제 중 오류가 발생했습니다."
      );
    },
    onSuccess: (result, visitorId, context) => {
      showSuccess("방문자 삭제 완료", "방문자 기록이 삭제되었습니다.");
    },
    onSettled: (data, error, variables, context) => {
      // 완료 후 관련 쿼리 다시 페치하여 최신 상태 보장
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [type] = query.queryKey;
          return type === "visitors" || type === "dashboardStats";
        },
      });
    },
  });
}

/**
 * Optimistic Update를 적용한 방문자 수정 Mutation Hook
 */
export function useUpdateVisitorOptimisticMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useCommonToast();

  return useMutation({
    mutationFn: async (data: UpdateVisitorRequest): Promise<VisitorEntry> => {
      const response = await apiClient(`/api/visitors/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.visitor;
    },
    onMutate: async (updatedVisitor) => {
      // 1. 진행 중인 refetch 취소
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] === "visitors",
      });

      // 2. 이전 데이터 스냅샷 저장
      const previousData = new Map();
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query) => {
          if (query.queryKey[0] === "visitors") {
            previousData.set(query.queryKey.join(","), query.state.data);
          }
        });

      // 3. 캐시에서 낙관적으로 방문자 업데이트
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query) => {
          if (query.queryKey[0] === "visitors") {
            queryClient.setQueryData(
              query.queryKey,
              (old: VisitorEntry[] | undefined) => {
                return old
                  ? old.map((visitor) =>
                      visitor.id === updatedVisitor.id
                        ? {
                            ...visitor,
                            ...updatedVisitor,
                            updated_at: new Date().toISOString(),
                          }
                        : visitor
                    )
                  : [];
              }
            );
          }
        });

      // 4. 롤백을 위한 컨텍스트 반환
      return {
        previousData,
        updatedVisitor,
      };
    },
    onError: (error, updatedVisitor, context) => {
      // 에러 발생 시 이전 데이터로 롤백
      if (context?.previousData) {
        context.previousData.forEach((data, key) => {
          const queryKey = key.split(",");
          queryClient.setQueryData(queryKey, data);
        });
      }

      showError(
        "방문자 수정 실패",
        error.message || "방문자 수정 중 오류가 발생했습니다."
      );
    },
    onSuccess: (actualVisitor, variables, context) => {
      // 성공 시 실제 데이터로 교체
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query) => {
          if (query.queryKey[0] === "visitors") {
            queryClient.setQueryData(
              query.queryKey,
              (old: VisitorEntry[] | undefined) => {
                return old
                  ? old.map((visitor) =>
                      visitor.id === actualVisitor.id ? actualVisitor : visitor
                    )
                  : [];
              }
            );
          }
        });

      showSuccess(
        "방문자 수정 완료",
        `${actualVisitor.visitor_name}님의 정보가 수정되었습니다.`
      );
    },
    onSettled: (data, error, variables, context) => {
      // 완료 후 관련 쿼리 다시 페치하여 최신 상태 보장
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [type] = query.queryKey;
          return type === "visitors" || type === "dashboardStats";
        },
      });
    },
  });
}

/**
 * Optimistic Update가 적용된 방문자 Mutation Hook들을 통합한 객체
 */
export function useOptimisticVisitorMutations() {
  const createMutation = useCreateVisitorOptimisticMutation();
  const updateMutation = useUpdateVisitorOptimisticMutation();
  const deleteMutation = useDeleteVisitorOptimisticMutation();

  return {
    // 생성 (Optimistic)
    createVisitor: createMutation.mutate,
    createVisitorAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // 수정 (Optimistic)
    updateVisitor: updateMutation.mutate,
    updateVisitorAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // 삭제 (Optimistic)
    deleteVisitor: deleteMutation.mutate,
    deleteVisitorAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // 전체 상태
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
