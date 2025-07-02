/**
 * Quick Action 통합 훅
 * 멤버 관리 액션(승격/강등/삭제)을 중앙화
 */

"use client";

import { useState, useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useFarmMembersStore } from "@/store/use-farm-members-store";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  updateMemberRole,
  removeMember,
  promoteMember,
  demoteMember,
  bulkPromoteMembers,
  bulkDemoteMembers,
  bulkRemoveMembers,
  canPromote,
  canDemote,
  canDelete,
  type MemberRole,
} from "@/lib/utils/data/member-actions";

export interface UseQuickActionsProps {
  farmId: string;
}

export interface UseQuickActionsReturn {
  // 로딩 상태
  isLoading: boolean;

  // 단일 액션
  handlePromote: (memberId: string) => Promise<void>;
  handleDemote: (memberId: string) => Promise<void>;
  handleDelete: (memberId: string) => Promise<void>;
  handleRoleChange: (
    memberId: string,
    newRole: "manager" | "viewer"
  ) => Promise<void>;

  // 일괄 액션
  handleBulkPromote: (memberIds: string[]) => Promise<void>;
  handleBulkDemote: (memberIds: string[]) => Promise<void>;
  handleBulkDelete: (memberIds: string[]) => Promise<void>;

  // 헬퍼 함수
  canPromoteMember: (role: MemberRole) => boolean;
  canDemoteMember: (role: MemberRole) => boolean;
  canDeleteMember: (role: MemberRole) => boolean;
}

export function useQuickActions({
  farmId,
}: UseQuickActionsProps): UseQuickActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useCommonToast();
  const { fetchMembers } = useFarmMembersStore();

  /**
   * 액션 완료 후 데이터 새로고침
   */
  const refreshData = useCallback(async () => {
    try {
      await fetchMembers(farmId);
    } catch (error) {
      devLog.error("Failed to refresh member data:", error);
    }
  }, [farmId, fetchMembers]);

  /**
   * 단일 멤버 승격
   */
  const handlePromote = useCallback(
    async (memberId: string) => {
      setIsLoading(true);
      try {
        const result = await promoteMember(farmId, memberId);

        if (result.success) {
          showSuccess("MEMBER_PROMOTED");
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  /**
   * 단일 멤버 강등
   */
  const handleDemote = useCallback(
    async (memberId: string) => {
      setIsLoading(true);
      try {
        const result = await demoteMember(farmId, memberId);

        if (result.success) {
          showSuccess("MEMBER_DEMOTED");
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  /**
   * 단일 멤버 삭제
   */
  const handleDelete = useCallback(
    async (memberId: string) => {
      setIsLoading(true);
      try {
        const result = await removeMember(farmId, memberId);

        if (result.success) {
          showSuccess("MEMBER_REMOVED");
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  /**
   * 단일 멤버 역할 변경 (범용)
   */
  const handleRoleChange = useCallback(
    async (memberId: string, newRole: "manager" | "viewer") => {
      setIsLoading(true);
      try {
        const result = await updateMemberRole(farmId, memberId, newRole);
        if (result.success) {
          if (newRole === "manager") {
            showSuccess("MEMBER_PROMOTED");
          } else {
            showSuccess("MEMBER_DEMOTED");
          }
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  /**
   * 일괄 멤버 승격
   */
  const handleBulkPromote = useCallback(
    async (memberIds: string[]) => {
      setIsLoading(true);
      try {
        const result = await bulkPromoteMembers(farmId, memberIds);

        if (result.success > 0) {
          showSuccess("MEMBER_PROMOTED");
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  /**
   * 일괄 멤버 강등
   */
  const handleBulkDemote = useCallback(
    async (memberIds: string[]) => {
      setIsLoading(true);
      try {
        const result = await bulkDemoteMembers(farmId, memberIds);

        if (result.success > 0) {
          showSuccess("MEMBER_DEMOTED");
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  /**
   * 일괄 멤버 삭제
   */
  const handleBulkDelete = useCallback(
    async (memberIds: string[]) => {
      setIsLoading(true);
      try {
        const result = await bulkRemoveMembers(farmId, memberIds);

        if (result.success > 0) {
          showSuccess("MEMBER_REMOVED");
          await refreshData();
        } else {
          showError("MEMBER_ACTION_FAILED");
        }
      } catch (error) {
        showError("MEMBER_ACTION_FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showSuccess, showError, refreshData]
  );

  return {
    isLoading,
    handlePromote,
    handleDemote,
    handleDelete,
    handleRoleChange,
    handleBulkPromote,
    handleBulkDemote,
    handleBulkDelete,
    canPromoteMember: canPromote,
    canDemoteMember: canDemote,
    canDeleteMember: canDelete,
  };
}
