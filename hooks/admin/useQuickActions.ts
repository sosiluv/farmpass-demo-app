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
  const { showInfo, showSuccess, showError } = useCommonToast();
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
      showInfo("멤버 승격 시작", "멤버를 승격하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await promoteMember(farmId, memberId);

        if (result.success) {
          showSuccess("멤버 승격 완료", "멤버가 성공적으로 승격되었습니다.");
          await refreshData();
        } else {
          showError(
            "멤버 승격 실패",
            "멤버를 승격하는 중 오류가 발생했습니다."
          );
        }
      } catch (error) {
        showError("멤버 승격 실패", "멤버를 승격하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
  );

  /**
   * 단일 멤버 강등
   */
  const handleDemote = useCallback(
    async (memberId: string) => {
      showInfo("멤버 강등 시작", "멤버를 강등하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await demoteMember(farmId, memberId);

        if (result.success) {
          showSuccess("멤버 강등 완료", "멤버가 성공적으로 강등되었습니다.");
          await refreshData();
        } else {
          showError(
            "멤버 강등 실패",
            "멤버를 강등하는 중 오류가 발생했습니다."
          );
        }
      } catch (error) {
        showError("멤버 강등 실패", "멤버를 강등하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
  );

  /**
   * 단일 멤버 삭제
   */
  const handleDelete = useCallback(
    async (memberId: string) => {
      showInfo("멤버 삭제 시작", "멤버를 삭제하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await removeMember(farmId, memberId);

        if (result.success) {
          showSuccess("멤버 삭제 완료", "멤버가 성공적으로 삭제되었습니다.");
          await refreshData();
        } else {
          showError(
            "멤버 삭제 실패",
            "멤버를 삭제하는 중 오류가 발생했습니다."
          );
        }
      } catch (error) {
        showError("멤버 삭제 실패", "멤버를 삭제하는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
  );

  /**
   * 단일 멤버 역할 변경 (범용)
   */
  const handleRoleChange = useCallback(
    async (memberId: string, newRole: "manager" | "viewer") => {
      showInfo("멤버 역할 변경 시작", "멤버 역할을 변경하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await updateMemberRole(farmId, memberId, newRole);
        if (result.success) {
          if (newRole === "manager") {
            showSuccess("멤버 승격 완료", "멤버가 성공적으로 승격되었습니다.");
          } else {
            showSuccess("멤버 강등 완료", "멤버가 성공적으로 강등되었습니다.");
          }
          await refreshData();
        } else {
          showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
        }
      } catch (error) {
        showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
  );

  /**
   * 일괄 멤버 승격
   */
  const handleBulkPromote = useCallback(
    async (memberIds: string[]) => {
      showInfo("멤버 일괄 승격 시작", "멤버들을 승격하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await bulkPromoteMembers(farmId, memberIds);

        if (result.success > 0) {
          showSuccess("멤버 승격 완료", "멤버가 성공적으로 승격되었습니다.");
          await refreshData();
        } else {
          showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
        }
      } catch (error) {
        showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
  );

  /**
   * 일괄 멤버 강등
   */
  const handleBulkDemote = useCallback(
    async (memberIds: string[]) => {
      showInfo("멤버 일괄 강등 시작", "멤버들을 강등하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await bulkDemoteMembers(farmId, memberIds);

        if (result.success > 0) {
          showSuccess("멤버 강등 완료", "멤버가 성공적으로 강등되었습니다.");
          await refreshData();
        } else {
          showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
        }
      } catch (error) {
        showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
  );

  /**
   * 일괄 멤버 삭제
   */
  const handleBulkDelete = useCallback(
    async (memberIds: string[]) => {
      showInfo("멤버 일괄 삭제 시작", "멤버들을 삭제하는 중입니다...");
      setIsLoading(true);
      try {
        const result = await bulkRemoveMembers(farmId, memberIds);

        if (result.success > 0) {
          showSuccess("멤버 삭제 완료", "멤버가 성공적으로 삭제되었습니다.");
          await refreshData();
        } else {
          showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
        }
      } catch (error) {
        showError("멤버 작업 실패", "멤버 작업 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [farmId, showInfo, showSuccess, showError, refreshData]
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
