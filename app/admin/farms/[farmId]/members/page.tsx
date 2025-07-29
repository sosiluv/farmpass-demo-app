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
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

// React Query Hooks
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { useFarmMembersQuery } from "@/lib/hooks/query/use-farm-members-query";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";

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
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile } = useProfileQuery(userId);
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
        const result = await inviteMemberMutation.mutateAsync({
          farm_id: farmId,
          email,
          role,
        });
        showSuccess("구성원 추가 완료", result.message);
      } catch (error: any) {
        const authError = getAuthErrorMessage(error);
        showError("구성원 추가 실패", authError.message);
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
        const result = await updateMemberRoleMutation.mutateAsync({
          farm_id: farmId,
          member_id: memberId,
          role: newRole,
        });
        showSuccess("권한 변경 완료", result.message);
      } catch (error: any) {
        const authError = getAuthErrorMessage(error);
        showError("권한 변경 실패", authError.message);
      }
    },
    [farmId, updateMemberRoleMutation, showInfo, showSuccess, showError]
  );

  // 멤버 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!memberToDelete) return;

    try {
      showInfo("구성원 삭제 중", "구성원을 삭제하는 중입니다...");
      const result = await removeMemberMutation.mutateAsync({
        farmId: farmId,
        memberId: memberToDelete,
      });
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      showSuccess("구성원 삭제 완료", result.message);
    } catch (error: any) {
      const authError = getAuthErrorMessage(error);
      showError("구성원 삭제 실패", authError.message);
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
        title={ERROR_CONFIGS.TIMEOUT.title}
        description={ERROR_CONFIGS.TIMEOUT.description}
        retry={retry}
        error={new Error("Timeout: 데이터 로딩 10초 초과")}
      />
    );
  }

  // 로딩 상태 처리
  if (membersLoading || farmsLoading || !farm) {
    return (
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <MembersPageHeader
          farm={farm || ({ id: farmId, farm_name: "로딩 중..." } as any)}
          canManageMembers={false}
          onAddMember={async () => {}}
        />
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
          title={ERROR_CONFIGS.NOT_FOUND.title}
          description={ERROR_CONFIGS.NOT_FOUND.description}
          error={new Error("Farm not found or access denied")}
          retry={retry}
        />
      );
    }
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 px-4 md:px-6 lg:px-8 pt-3 pb-4 md:pb-6 lg:pb-8">
        <MembersPageHeader
          farm={farm}
          canManageMembers={canManageMembers()}
          onAddMember={handleAddMember}
        />

        <MembersList
          members={members}
          canManageMembers={canManageMembers()}
          onDelete={handleDeleteRequest}
          onRoleChange={handleRoleChange}
        />

        <DeleteMemberDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          isLoading={removeMemberMutation.isPending}
        />
      </div>
    </ErrorBoundary>
  );
}
