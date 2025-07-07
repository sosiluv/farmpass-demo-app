"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/utils/data/api-client";
import { createFarmMemberQueryKey } from "@/lib/hooks/query-utils";
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
      });
      return response.member;
    },
    onSuccess: (newMember, variables) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: createFarmMemberQueryKey(variables.farm_id),
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
        }
      );
      return response.member;
    },
    onSuccess: (updatedMember, variables) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: createFarmMemberQueryKey(variables.farm_id),
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
      // 기존 Zustand store와 동일한 API 엔드포인트 사용
      const response = await apiClient(
        `/api/farms/${farmId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );
      return response;
    },
    onSuccess: (result, variables) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: createFarmMemberQueryKey(variables.farmId),
      });
    },
  });
}

/**
 * 멤버 초대 수락 Mutation Hook
 */
export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      invitationToken: string
    ): Promise<{ farm: any; member: FarmMember }> => {
      const response = await apiClient("/api/farm-members/accept-invitation", {
        method: "POST",
        body: JSON.stringify({ token: invitationToken }),
      });
      return response;
    },
    onSuccess: (result, invitationToken) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: createFarmMemberQueryKey(result.farm.id),
      });

      // 사용자의 농장 목록도 무효화 (새로운 농장이 추가됨)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [type] = query.queryKey;
          return type === "farms";
        },
      });
    },
  });
}

/**
 * 멤버 초대 거절 Mutation Hook
 */
export function useDeclineInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      invitationToken: string
    ): Promise<{ success: boolean }> => {
      const response = await apiClient("/api/farm-members/decline-invitation", {
        method: "POST",
        body: JSON.stringify({ token: invitationToken }),
      });
      return response;
    },
  });
}

/**
 * 농장 탈퇴 Mutation Hook
 */
export function useLeaveFarmMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (farmId: string): Promise<{ success: boolean }> => {
      const response = await apiClient(`/api/farm-members/leave/${farmId}`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: (result, farmId) => {
      // 농장 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: createFarmMemberQueryKey(farmId),
      });

      // 사용자의 농장 목록도 무효화 (탈퇴한 농장이 제거됨)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [type] = query.queryKey;
          return type === "farms";
        },
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
  const acceptInvitationMutation = useAcceptInvitationMutation();
  const declineInvitationMutation = useDeclineInvitationMutation();
  const leaveFarmMutation = useLeaveFarmMutation();

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

    // 초대 수락
    acceptInvitation: acceptInvitationMutation.mutate,
    acceptInvitationAsync: acceptInvitationMutation.mutateAsync,
    isAccepting: acceptInvitationMutation.isPending,
    acceptError: acceptInvitationMutation.error,

    // 초대 거절
    declineInvitation: declineInvitationMutation.mutate,
    declineInvitationAsync: declineInvitationMutation.mutateAsync,
    isDeclining: declineInvitationMutation.isPending,
    declineError: declineInvitationMutation.error,

    // 농장 탈퇴
    leaveFarm: leaveFarmMutation.mutate,
    leaveFarmAsync: leaveFarmMutation.mutateAsync,
    isLeaving: leaveFarmMutation.isPending,
    leaveError: leaveFarmMutation.error,

    // 전체 상태
    isLoading:
      inviteMutation.isPending ||
      updateRoleMutation.isPending ||
      removeMutation.isPending ||
      acceptInvitationMutation.isPending ||
      declineInvitationMutation.isPending ||
      leaveFarmMutation.isPending,
  };
}
