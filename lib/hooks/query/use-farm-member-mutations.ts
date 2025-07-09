"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import { farmsKeys } from "@/lib/hooks/query/query-keys";
import type { FarmMember } from "@/lib/types";

export interface InviteMemberRequest {
  farm_id: string;
  email: string;
  role: "owner" | "manager" | "viewer";
  message?: string;
}

export interface UpdateMemberRoleRequest {
  farm_id: string;
  member_id: string;
  role: "owner" | "manager" | "viewer";
}

/**
 * 멤버 초대 Mutation Hook
 */
export function useInviteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteMemberRequest): Promise<FarmMember> => {
      // 기존 Zustand store와 동일한 API 엔드포인트 사용
      const response = await apiClient(`/api/farms/${data.farm_id}/members`, {
        method: "POST",
        body: JSON.stringify({ email: data.email, role: data.role }),
        context: "멤버 초대",
        onError: (error, context) => {
          handleError(error, context);
        },
      });
      return response.member;
    },
    onSuccess: (newMember, variables) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: farmsKeys.farmMembers(variables.farm_id),
      });
    },
  });
}

/**
 * 멤버 역할 변경 Mutation Hook
 */
export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemberRoleRequest): Promise<FarmMember> => {
      const response = await apiClient(
        `/api/farms/${data.farm_id}/members/${data.member_id}`,
        {
          method: "PUT",
          body: JSON.stringify({ role: data.role }),
          context: "멤버 역할 변경",
          onError: (error, context) => {
            handleError(error, context);
          },
        }
      );
      return response.member;
    },
    onSuccess: (updatedMember, variables) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: farmsKeys.farmMembers(variables.farm_id),
      });
    },
  });
}

/**
 * 멤버 제거 Mutation Hook
 */
export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      farmId,
      memberId,
    }: {
      farmId: string;
      memberId: string;
    }): Promise<{ success: boolean }> => {
      const response = await apiClient(
        `/api/farms/${farmId}/members/${memberId}`,
        {
          method: "DELETE",
          context: "멤버 제거",
          onError: (error, context) => {
            handleError(error, context);
          },
        }
      );
      return response;
    },
    onSuccess: (result, variables) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: farmsKeys.farmMembers(variables.farmId),
      });
    },
  });
}

/**
 * 농장 멤버 Mutation Hook들을 통합한 객체
 */
export function useFarmMemberMutations() {
  const inviteMutation = useInviteMemberMutation();
  const updateRoleMutation = useUpdateMemberRoleMutation();
  const removeMutation = useRemoveMemberMutation();

  return {
    // 초대
    inviteMember: inviteMutation.mutate,
    inviteMemberAsync: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    inviteError: inviteMutation.error,

    // 역할 변경
    updateMemberRole: updateRoleMutation.mutate,
    updateMemberRoleAsync: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
    updateRoleError: updateRoleMutation.error,

    // 제거
    removeMember: removeMutation.mutate,
    removeMemberAsync: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    removeError: removeMutation.error,

    // 전체 상태
    isLoading:
      inviteMutation.isPending ||
      updateRoleMutation.isPending ||
      removeMutation.isPending,
  };
}
