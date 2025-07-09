/**
 * 멤버 관리 관련 React Query Mutations
 * 멤버 역할 변경, 삭제, 일괄 처리 등
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/utils/data";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { handleError } from "@/lib/utils/error";

export type MemberRole = "owner" | "manager" | "viewer";

export interface MemberActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  results: MemberActionResult[];
}

// 멤버 역할 변경 (Mutation)
export const useUpdateMemberRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      farmId,
      memberId,
      newRole,
    }: {
      farmId: string;
      memberId: string;
      newRole: "manager" | "viewer";
    }) => {
      devLog.log("[MUTATION] 멤버 역할 변경 시작", {
        farmId,
        memberId,
        newRole,
      });

      await apiClient(`/api/farms/${farmId}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
        context: "멤버 역할 변경",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      return {
        success: true,
        message: `권한이 ${
          newRole === "manager" ? "관리자" : "조회자"
        }로 변경되었습니다.`,
      };
    },
    onSuccess: (_, { farmId }) => {
      // 해당 농장의 멤버 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["farm-members", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      devLog.log("[MUTATION] 멤버 역할 변경 완료, 캐시 무효화");
    },
    onError: (error, { farmId, memberId, newRole }) => {
      devLog.error("[MUTATION] 멤버 역할 변경 실패:", error);
      return {
        success: false,
        message: "권한 변경에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    },
  });
};

// 멤버 삭제 (Mutation)
export const useDeleteMemberMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      farmId,
      memberId,
    }: {
      farmId: string;
      memberId: string;
    }) => {
      devLog.log("[MUTATION] 멤버 삭제 시작", { farmId, memberId });

      await apiClient(`/api/farms/${farmId}/members/${memberId}`, {
        method: "DELETE",
        context: "멤버 삭제",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      return {
        success: true,
        message: "멤버가 성공적으로 삭제되었습니다.",
      };
    },
    onSuccess: (_, { farmId }) => {
      // 해당 농장의 멤버 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["farm-members", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      devLog.log("[MUTATION] 멤버 삭제 완료, 캐시 무효화");
    },
    onError: (error, { farmId, memberId }) => {
      devLog.error("[MUTATION] 멤버 삭제 실패:", error);
      return {
        success: false,
        message: "멤버 삭제에 실패했습니다.",
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    },
  });
};

// 멤버 일괄 역할 변경 (Mutation)
export const useBulkUpdateMemberRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      farmId,
      memberIds,
      newRole,
    }: {
      farmId: string;
      memberIds: string[];
      newRole: "manager" | "viewer";
    }): Promise<BulkActionResult> => {
      devLog.log("[MUTATION] 멤버 일괄 역할 변경 시작", {
        farmId,
        memberIds,
        newRole,
      });

      const results: MemberActionResult[] = [];
      let success = 0;
      let failed = 0;

      for (const memberId of memberIds) {
        try {
          await apiClient(`/api/farms/${farmId}/members/${memberId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
            context: `멤버 일괄 역할 변경 - ${memberId}`,
            onError: (error, context) => {
              throw error; // catch 블록에서 처리
            },
          });

          results.push({
            success: true,
            message: `권한이 ${
              newRole === "manager" ? "관리자" : "조회자"
            }로 변경되었습니다.`,
          });
          success++;
        } catch (error) {
          results.push({
            success: false,
            message: "권한 변경에 실패했습니다.",
            error: error instanceof Error ? error.message : "알 수 없는 오류",
          });
          failed++;
        }
      }

      return { success, failed, results };
    },
    onSuccess: (_, { farmId }) => {
      // 해당 농장의 멤버 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["farm-members", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      devLog.log("[MUTATION] 멤버 일괄 역할 변경 완료, 캐시 무효화");
    },
    onError: (error, { farmId, memberIds, newRole }) => {
      devLog.error("[MUTATION] 멤버 일괄 역할 변경 실패:", error);
    },
  });
};

// 멤버 일괄 삭제 (Mutation)
export const useBulkDeleteMembersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      farmId,
      memberIds,
    }: {
      farmId: string;
      memberIds: string[];
    }): Promise<BulkActionResult> => {
      devLog.log("[MUTATION] 멤버 일괄 삭제 시작", { farmId, memberIds });

      const results: MemberActionResult[] = [];
      let success = 0;
      let failed = 0;

      for (const memberId of memberIds) {
        try {
          await apiClient(`/api/farms/${farmId}/members/${memberId}`, {
            method: "DELETE",
            context: `멤버 일괄 삭제 - ${memberId}`,
            onError: (error, context) => {
              throw error; // catch 블록에서 처리
            },
          });

          results.push({
            success: true,
            message: "멤버가 성공적으로 삭제되었습니다.",
          });
          success++;
        } catch (error) {
          results.push({
            success: false,
            message: "멤버 삭제에 실패했습니다.",
            error: error instanceof Error ? error.message : "알 수 없는 오류",
          });
          failed++;
        }
      }

      return { success, failed, results };
    },
    onSuccess: (_, { farmId }) => {
      // 해당 농장의 멤버 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["farm-members", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      devLog.log("[MUTATION] 멤버 일괄 삭제 완료, 캐시 무효화");
    },
    onError: (error, { farmId, memberIds }) => {
      devLog.error("[MUTATION] 멤버 일괄 삭제 실패:", error);
    },
  });
};
