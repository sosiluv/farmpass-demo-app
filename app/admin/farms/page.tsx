"use client";

import type React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { type FarmFormValues } from "@/lib/utils/validation";
import { useFarms, type Farm } from "@/lib/hooks/use-farms";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";

import { useFarmsContext } from "@/components/providers/farms-provider";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import {
  FarmsPageHeader,
  FarmsList,
  EmptyFarmsState,
  DeleteConfirmDialog,
} from "@/components/admin/farms";
import { useFarmMembersPreview } from "@/lib/hooks/use-farm-members-preview-safe";
import type { MemberWithProfile } from "@/lib/hooks/use-farm-members-preview-safe";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { AdminError } from "@/components/error/admin-error";
import { useDataFetchTimeout } from "@/hooks/useTimeout";

interface FarmMembersData {
  count: number;
  members: MemberWithProfile[];
  loading: boolean;
}

export default function FarmsPage() {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const { showSuccess, showError } = useCommonToast();
  const {
    farms,
    fetchState,
    error,
    successMessage,
    addFarm,
    updateFarm,
    deleteFarm,
    refetch,
    clearMessages,
  } = useFarms(profile?.id);
  const { isLoading } = useFarmsContext();

  // 로컬 상태 관리
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState<string | null>(null);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  // 타임아웃 관리
  const { timeoutReached, retry } = useDataFetchTimeout(
    isLoading || fetchState.loading,
    refetch,
    { timeout: 10000 }
  );

  // 에러 토스트 처리
  useEffect(() => {
    if (error) {
      showError("오류", error);
      clearMessages();
    }
  }, [error, showError, clearMessages]);

  // 성공 토스트 처리
  useEffect(() => {
    if (successMessage) {
      showSuccess("성공", successMessage);
      clearMessages();
    }
  }, [successMessage, showSuccess, clearMessages]);

  // 소유자 확인 함수 메모이제이션
  const isOwner = useCallback(
    (farm: Farm) => profile?.id === farm.owner_id,
    [profile?.id]
  );

  // 폼 제출 핸들러 메모이제이션
  const handleSubmit = useCallback(
    async (values: FarmFormValues) => {
      if (!profile?.id) {
        devLog.error("No profile ID available");
        return;
      }

      try {
        if (editingFarm) {
          await updateFarm(editingFarm.id, values);
        } else {
          await addFarm(values);
        }

        setDialogOpen(false);
        setEditingFarm(null);
      } catch (error) {
        devLog.error("Failed to submit farm:", error);
      }
    },
    [profile?.id, editingFarm, updateFarm, addFarm]
  );

  // 편집 핸들러 메모이제이션
  const handleEdit = useCallback((farm: Farm) => {
    setEditingFarm(farm);
    setDialogOpen(true);
  }, []);

  // 삭제 핸들러 메모이제이션
  const handleDelete = useCallback((farmId: string) => {
    setFarmToDelete(farmId);
    setDeleteDialogOpen(true);
  }, []);

  // 삭제 확인 핸들러 메모이제이션
  const confirmDelete = useCallback(async () => {
    if (!farmToDelete) return;

    try {
      await deleteFarm(farmToDelete);
      setDeleteDialogOpen(false);
      setFarmToDelete(null);
    } catch (error) {
      devLog.error("Failed to delete farm:", error);
    }
  }, [farmToDelete, deleteFarm]);

  // 농장 추가 버튼 클릭 핸들러
  const handleAddClick = useCallback(() => {
    setEditingFarm(null);
    setDialogOpen(true);
  }, []);

  const farmIds = useMemo(() => farms.map((f) => f.id), [farms]);
  const { getMembersForFarm } = useFarmMembersPreview(farmIds);

  // 농장별 구성원 데이터를 객체로 변환
  const farmMembersData = useMemo(() => {
    const data: Record<string, FarmMembersData> = {};
    farmIds.forEach((farmId) => {
      data[farmId] = getMembersForFarm(farmId);
    });
    return data;
  }, [farmIds, getMembersForFarm]);

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
  if (isLoading || fetchState.loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <ErrorBoundary
      title="농장 관리 오류"
      description="농장 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        {/* 헤더 */}
        <FarmsPageHeader
          dialogOpen={dialogOpen}
          onDialogOpenChange={setDialogOpen}
          editingFarm={editingFarm}
          onSubmit={handleSubmit}
          onAddClick={handleAddClick}
        />

        {/* 삭제 확인 다이얼로그 */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
        />

        {/* 농장 목록 또는 빈 상태 */}
        {farms.length === 0 ? (
          <EmptyFarmsState onAddClick={handleAddClick} />
        ) : (
          <ResponsivePagination data={farms} itemsPerPage={12}>
            {({ paginatedData, isLoadingMore, hasMore }) => (
              <div className="space-y-4">
                <FarmsList
                  farms={paginatedData}
                  isOwner={isOwner}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  farmMembersData={farmMembersData}
                />
                {/* 모바일 무한 스크롤 로딩 상태는 ResponsivePagination에서 처리 */}
              </div>
            )}
          </ResponsivePagination>
        )}
      </div>
    </ErrorBoundary>
  );
}
