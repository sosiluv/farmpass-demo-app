"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFarmsContext } from "@/components/providers/farms-provider";
import { useFarmMutations } from "@/lib/hooks/query/use-farm-mutations";
import { useAuth } from "@/components/providers/auth-provider";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";
import { Farm } from "@/lib/types/farm";
import { FarmsList } from "@/components/admin/farms/FarmsList";
import { FarmsPageHeader } from "@/components/admin/farms/FarmsPageHeader";
import { EmptyFarmsState } from "@/components/admin/farms/EmptyFarmsState";
import { DeleteConfirmDialog } from "@/components/admin/farms/DeleteConfirmDialog";
import { Input } from "@/components/ui/input";
import { StatsSkeleton, TableSkeleton } from "@/components/common/skeletons";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ResponsivePagination } from "@/components/common/responsive-pagination";
import type { FarmFormValues } from "@/lib/utils/validation";

export default function FarmsPage() {
  const { showInfo, showSuccess, showError } = useCommonToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [farmToDelete, setFarmToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { farms, isLoading, error } = useFarmsContext();
  const {
    createFarmAsync,
    updateFarmAsync,
    deleteFarmAsync,
    isDeleting,
    isCreating,
    isUpdating,
  } = useFarmMutations();
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;

  // 농장별 멤버 데이터는 각 FarmCard에서 개별적으로 로딩
  // 여기서는 전체적인 농장 목록만 관리

  // 검색 필터링
  const filteredFarms = farms.filter(
    (farm: Farm) =>
      farm.farm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.farm_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingFarm(null);
    setDialogOpen(true);
  };

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm);
    setDialogOpen(true);
  };

  const handleDelete = (farmId: string) => {
    setFarmToDelete(farmId);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: FarmFormValues) => {
    try {
      if (editingFarm) {
        showInfo("농장 수정 중", "농장 정보를 수정하는 중입니다...");
        const result = await updateFarmAsync({
          ...values,
          id: editingFarm.id,
        });
        showSuccess("농장 수정 완료", result.message);
      } else {
        showInfo("농장 등록 중", "새 농장을 등록하는 중입니다...");
        const result = await createFarmAsync(values);
        showSuccess("농장 등록 완료", result.message);
      }
      setDialogOpen(false);
      setEditingFarm(null);
    } catch (error: any) {
      const authError = getAuthErrorMessage(error);
      showError(
        editingFarm ? "농장 수정 실패" : "농장 등록 실패",
        authError.message
      );
      console.error("농장 저장 중 오류:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!farmToDelete) return;

    try {
      showInfo("농장 삭제 중", "농장을 삭제하는 중입니다...");
      const result = await deleteFarmAsync(farmToDelete);
      showSuccess("농장 삭제 완료", result.message);
      setDeleteDialogOpen(false);
      setFarmToDelete(null);
    } catch (error: any) {
      console.error("농장 삭제 중 오류:", error);

      // 404 에러인 경우 (이미 삭제된 경우)
      if (
        error &&
        typeof error === "object" &&
        "error" in error &&
        (error as any).error === "FARM_NOT_FOUND"
      ) {
        showSuccess(
          "농장 삭제 완료",
          (error as any).message || "농장을 찾을 수 없습니다."
        );
        setDeleteDialogOpen(false);
        setFarmToDelete(null);
      } else {
        const authError = getAuthErrorMessage(error);
        showError("농장 삭제 실패", authError.message);
      }
    }
  };

  const isOwner = (farm: Farm) => {
    if (!profile) return false;
    // 관리자이거나 농장 소유자인 경우
    return profile.account_type === "admin" || farm.owner_id === profile.id;
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-6 pt-2 md:pt-4">
        <FarmsPageHeader
          dialogOpen={false}
          onDialogOpenChange={() => {}}
          editingFarm={null}
          onSubmit={async () => {}}
          onAddClick={() => {}}
        />
        <StatsSkeleton columns={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  // 에러 상태는 ErrorBoundary에서 처리

  return (
    <ErrorBoundary
      title="농장 관리 오류"
      description="농장 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <div className="flex-1 space-y-4 p-1 md:p-6 pt-2 md:pt-4">
        <FarmsPageHeader
          dialogOpen={dialogOpen}
          onDialogOpenChange={setDialogOpen}
          editingFarm={editingFarm}
          onSubmit={handleSubmit}
          onAddClick={handleAddClick}
          isLoading={isCreating || isUpdating}
        />

        {/* 검색 기능 */}
        <div className="mb-6">
          <Input
            id="farm-search"
            placeholder="농장 검색... (농장명, 주소)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-12 text-base placeholder:text-xs sm:placeholder:text-sm"
          />
        </div>

        {filteredFarms.length === 0 && searchTerm ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 text-gray-400">🔍</div>
            </div>
            <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              '{searchTerm}'에 해당하는 농장이 없습니다
            </p>
          </div>
        ) : farms.length === 0 ? (
          <EmptyFarmsState onAddClick={handleAddClick} />
        ) : (
          <ResponsivePagination<Farm> data={filteredFarms} itemsPerPage={12}>
            {({ paginatedData, isLoadingMore, hasMore }) => (
              <div className="space-y-4">
                <FarmsList
                  farms={paginatedData}
                  isOwner={isOwner}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                {/* 모바일 무한 스크롤 로딩 상태는 ResponsivePagination에서 처리 */}
              </div>
            )}
          </ResponsivePagination>
        )}

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      </div>
    </ErrorBoundary>
  );
}
