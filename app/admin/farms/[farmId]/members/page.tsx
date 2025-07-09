"use client";

import { useState, useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useAuth } from "@/components/providers/auth-provider";
import {
  MembersPageHeader,
  MembersList,
  DeleteMemberDialog,
} from "@/components/admin/farms/members";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";

// React Query Hooks
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useFarmMembersQuery } from "@/lib/hooks/query/use-farm-members-query";

// React Query Mutations
import {
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from "@/lib/hooks/query/use-farm-member-mutations";

interface PageProps {
  params: {
    farmId: string;
  };
}

export default function MembersPage({ params }: PageProps) {
  const farmId = params.farmId as string;
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const { showInfo, showSuccess, showError } = useCommonToast();

  // React Query Hooks
  const farmsQuery = useFarmsQuery();
  const membersQuery = useFarmMembersQuery(farmId);

  // React Query Mutations
  const inviteMemberMutation = useInviteMemberMutation();
  const updateMemberRoleMutation = useUpdateMemberRoleMutation();
  const removeMemberMutation = useRemoveMemberMutation();

  // 데이터 선택
  const farms = farmsQuery.farms || [];
  const members = membersQuery.members || [];
  const membersLoading = membersQuery.loading;
  const farmsLoading = farmsQuery.loading;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(
    membersLoading || farmsLoading,
    () => {
      farmsQuery.refetch();
      membersQuery.refetch();
    },
    { timeout: 10000 }
  );

  const farm = farms.find((f) => f.id === farmId);

  // 현재 사용자가 농장 소유자, 관리자 또는 시스템 관리자인지 확인
  const canManageMembers = useCallback(() => {
    if (!profile || !farm) return false;

    // 시스템 관리자인 경우 모든 농장의 구성원 관리 가능
    if (profile.account_type == "admin") return true;

    // 농장 소유자이거나 농장 관리자인 경우
    return (
      farm.owner_id === profile.id ||
      members.some(
        (member) =>
          member.user_id === profile.id &&
          (member.role === "owner" || member.role === "manager")
      )
    );
  }, [profile, farm, members]);

  // 멤버 추가 핸들러
  const handleAddMember = useCallback(
    async (email: string, role: "manager" | "viewer") => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("입력 오류", "올바른 이메일 형식을 입력해주세요.");
        return;
      }

      try {
        showInfo("구성원 추가 중", `${email}을(를) 추가하는 중입니다...`);
        await inviteMemberMutation.mutateAsync({
          farm_id: farmId,
          email,
          role,
        });
        showSuccess(
          "구성원 추가 완료",
          `${email}이 ${
            role === "manager" ? "관리자" : "조회자"
          }로 추가되었습니다.`
        );
      } catch (error: any) {
        let errorMessage = "구성원 추가에 실패했습니다.";
        if (error.message) {
          if (error.message.includes("User not found")) {
            errorMessage = "해당 이메일로 등록된 사용자를 찾을 수 없습니다.";
          } else if (
            error.message.includes("already exists") ||
            error.message.includes("already a member")
          ) {
            errorMessage = "이미 농장의 구성원입니다.";
          } else if (error.message.includes("Invalid email")) {
            errorMessage = "유효하지 않은 이메일 주소입니다.";
          } else if (
            error.message.includes("Unauthorized") ||
            error.message.includes("permission")
          ) {
            errorMessage = "구성원을 추가할 권한이 없습니다.";
          } else {
            errorMessage = error.message;
          }
        }

        showError("구성원 추가 실패", errorMessage);
        throw error;
      }
    },
    [farmId, inviteMemberMutation, showInfo, showSuccess, showError]
  );

  // 역할 변경 핸들러
  const handleRoleChange = useCallback(
    async (memberId: string, newRole: "manager" | "viewer") => {
      try {
        showInfo("권한 변경 중", "구성원 권한을 변경하는 중입니다...");
        await updateMemberRoleMutation.mutateAsync({
          farm_id: farmId,
          member_id: memberId,
          role: newRole,
        });
        showSuccess(
          "권한 변경 완료",
          `구성원 권한이 ${
            newRole === "manager" ? "관리자" : "조회자"
          }로 변경되었습니다.`
        );
      } catch (error: any) {
        showError(
          "권한 변경 실패",
          error.message || "권한 변경에 실패했습니다."
        );
      }
    },
    [farmId, updateMemberRoleMutation, showInfo, showSuccess, showError]
  );

  // 멤버 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!memberToDelete) return;

    try {
      showInfo("구성원 삭제 중", "구성원을 삭제하는 중입니다...");
      await removeMemberMutation.mutateAsync({
        farmId: farmId,
        memberId: memberToDelete,
      });
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      showSuccess("구성원 삭제 완료", "구성원이 삭제되었습니다.");
    } catch (error: any) {
      showError(
        "구성원 삭제 실패",
        error.message || "구성원 삭제에 실패했습니다."
      );
    }
  }, [
    farmId,
    memberToDelete,
    removeMemberMutation,
    showInfo,
    showSuccess,
    showError,
  ]);

  const handleDeleteRequest = useCallback((id: string) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  // 타임아웃 상태 처리
  if (timeoutReached) {
    return (
      <AdminError
        title="데이터를 불러오지 못했습니다"
        description="네트워크 상태를 확인하거나 다시 시도해 주세요."
        retry={retry}
        error={new Error("Timeout: 데이터 로딩 10초 초과")}
      />
    );
  }

  // 로딩 상태 처리
  if (membersLoading || farmsLoading || !farm) {
    return (
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6">
        <StatsSkeleton columns={3} />
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  // 농장을 찾을 수 없는 경우
  if (!farmsLoading && farms.length > 0 && !farm) {
    const farmExists = farms.some((f) => f.id === farmId);
    if (!farmExists) {
      return (
        <AdminError
          title="농장을 찾을 수 없습니다"
          description="요청하신 농장이 존재하지 않거나 접근 권한이 없습니다."
          error={new Error("Farm not found or access denied")}
          retry={retry}
        />
      );
    }
  }

  return (
    <ErrorBoundary
      title="농장 구성원 관리 오류"
      description="농장 구성원 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6">
        <MembersPageHeader
          farm={farm}
          canManageMembers={canManageMembers()}
          onAddMember={handleAddMember}
        />

        <MembersList
          members={members}
          loading={membersLoading}
          canManageMembers={canManageMembers()}
          onDelete={handleDeleteRequest}
          onRoleChange={handleRoleChange}
        />

        <DeleteMemberDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
        />
      </div>
    </ErrorBoundary>
  );
}
