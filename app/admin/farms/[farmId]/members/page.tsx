"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useFarmMembersStore } from "@/store/use-farm-members-store";
import { useFarms } from "@/lib/hooks/use-farms";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import {
  MembersPageHeader,
  MembersList,
  DeleteMemberDialog,
} from "@/components/admin/farms/members";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { CardSkeleton } from "@/components/common/skeletons";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";

interface PageProps {
  params: {
    farmId: string;
  };
}

export default function MembersPage({ params }: PageProps) {
  const farmId = params.farmId as string;
  const { state } = useAuth();
  const user = state.status === "authenticated" ? state.user : null;
  const { farms, fetchState } = useFarms(user?.id);
  const {
    members,
    loading,
    fetchMembers,
    addMember,
    updateMemberRole,
    removeMember,
    refetch,
  } = useFarmMembersStore();
  const toast = useCommonToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastFetchedFarmId = useRef<string | null>(null);

  // 타임아웃 관리 - refetch 함수 사용
  const { timeoutReached, retry } = useDataFetchTimeout(
    loading || fetchState.loading,
    refetch,
    { timeout: 10000 }
  );

  const farm = farms.find((f) => f.id === farmId);

  // 현재 사용자가 농장 소유자 또는 관리자인지 확인 (메모이제이션)
  const canManageMembers = useCallback(() => {
    if (!user || !farm) return false;

    return (
      farm.owner_id === user.id ||
      members.some(
        (member) => member.user_id === user.id && member.role === "manager"
      )
    );
  }, [user, farm, members]);

  // 초기 데이터 로드 (한 번만 실행)
  useEffect(() => {
    if (!isInitialized && farmId && !fetchState.loading && user?.id) {
      const loadMembers = async () => {
        try {
          await fetchMembers(farmId);
          lastFetchedFarmId.current = farmId;
          setIsInitialized(true);
        } catch (error) {
          devLog.error("Failed to fetch members:", error);
        }
      };

      loadMembers();
    }
  }, [farmId, isInitialized, fetchState.loading, fetchMembers, user?.id]);

  // farmId 변경 시 초기화
  useEffect(() => {
    if (isInitialized && farmId !== lastFetchedFarmId.current) {
      setIsInitialized(false);
      lastFetchedFarmId.current = null;
    }
  }, [farmId, isInitialized]);

  const handleAddMember = useCallback(
    async (email: string, role: "manager" | "viewer") => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.showCustomError(
          "입력 오류",
          "올바른 이메일 형식을 입력해주세요."
        );
        return;
      }

      try {
        await addMember(farmId, email, role);
        toast.showCustomSuccess(
          "구성원 추가 완료",
          `${email}이 ${
            role === "manager" ? "관리자" : "조회자"
          }로 추가되었습니다.`
        );
      } catch (error: any) {
        let errorMessage = "구성원 추가에 실패했습니다.";
        if (error.message) {
          errorMessage = error.message;
        }

        toast.showCustomError("구성원 추가 실패", errorMessage);
        throw error; // 다이얼로그에서 처리하기 위해 에러를 다시 던짐
      }
    },
    [farmId, addMember, toast]
  );

  const handleRoleChange = useCallback(
    async (memberId: string, newRole: "manager" | "viewer") => {
      try {
        await updateMemberRole(farmId, memberId, newRole);
        toast.showCustomSuccess(
          "권한 변경 완료",
          `구성원 권한이 ${
            newRole === "manager" ? "관리자" : "조회자"
          }로 변경되었습니다.`
        );
      } catch (error: any) {
        toast.showCustomError(
          "권한 변경 실패",
          error.message || "권한 변경에 실패했습니다."
        );
      }
    },
    [farmId, updateMemberRole, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!memberToDelete) return;

    try {
      await removeMember(farmId, memberToDelete);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      toast.showCustomSuccess("구성원 삭제 완료", "구성원이 삭제되었습니다.");
    } catch (error: any) {
      toast.showCustomError(
        "구성원 삭제 실패",
        error.message || "구성원 삭제에 실패했습니다."
      );
    }
  }, [farmId, memberToDelete, removeMember, toast]);

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

  // 로딩 상태 처리 (farms 로딩도 포함)
  if (loading || fetchState.loading || !farm) {
    return (
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 md:pt-6">
        <CardSkeleton
          count={3}
          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    );
  }

  // farms 로딩이 완료되었지만 해당 농장을 찾을 수 없는 경우
  if (!fetchState.loading && farms.length > 0 && !farm) {
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
          loading={loading}
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
