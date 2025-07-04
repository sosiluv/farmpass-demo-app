"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFarmsStore } from "@/store/use-farms-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { FarmFormValues } from "@/lib/utils/validation";

export interface Farm {
  id: string;
  farm_name: string;
  description: string | null;
  farm_address: string;
  farm_detailed_address: string | null;
  farm_type: string | null;
  owner_id: string;
  manager_phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useFarms(userId?: string) {
  const toast = useCommonToast();
  const {
    farms,
    fetchState,
    fetchFarms: storeFetchFarms,
    addFarm: storeFarmAdd,
    updateFarm: storeFarmUpdate,
    deleteFarm: storeFarmDelete,
  } = useFarmsStore();

  // useRef로 관리하여 상태 변경으로 인한 리렌더링 방지
  const isFetchingRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const hasDataRef = useRef(false);

  const fetchFarms = useCallback(
    async (targetUserId?: string, forceRefetch: boolean = false) => {
      const userIdToUse = targetUserId || userId;

      // 중복 요청 방지
      if (isFetchingRef.current) {
        devLog.log(`Already loading farms for userId: ${userIdToUse}`);
        return;
      }

      // userId가 변경되지 않았고 데이터가 있으면 요청하지 않음 (강제 새로고침이 아닌 경우)
      if (
        !forceRefetch &&
        userIdToUse === lastUserIdRef.current &&
        hasDataRef.current
      ) {
        devLog.log(
          `UserId unchanged and has data, skipping fetch: ${userIdToUse}`
        );
        return;
      }

      if (!userIdToUse) {
        devLog.error("[useFarms] userId 없이 농장 조회 시도");
        return;
      }

      try {
        isFetchingRef.current = true;
        lastUserIdRef.current = userIdToUse;

        devLog.log(`Fetching farms for userId: ${userIdToUse}`);
        await storeFetchFarms(userIdToUse);
        hasDataRef.current = true;
      } catch (error) {
        devLog.error("Failed to fetch farms:", error);
        hasDataRef.current = false;

        toast.showCustomError(
          "농장 목록 조회 실패",
          "농장 목록을 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        isFetchingRef.current = false;
      }
    },
    [userId, storeFetchFarms, toast]
  );

  const refetch = useCallback(() => {
    return fetchFarms(undefined, true);
  }, [fetchFarms]);

  // userId 변경 시 ref 초기화
  useEffect(() => {
    if (userId !== lastUserIdRef.current) {
      hasDataRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (userId !== undefined) {
      fetchFarms();
    }
  }, [userId, fetchFarms]);

  const addFarm = useCallback(
    async (values: FarmFormValues, targetUserId?: string) => {
      const userIdToUse = targetUserId || userId;
      if (!userIdToUse) {
        devLog.error("[useFarms] userId 없이 농장 등록 시도");
        toast.showCustomError("권한 없음", "농장을 등록할 권한이 없습니다.");
        return null;
      }

      try {
        const farm = await storeFarmAdd(userIdToUse, values);
        if (farm) {
          toast.showCustomSuccess(
            "농장 등록 완료",
            "농장이 성공적으로 등록되었습니다."
          );
        }
        return farm;
      } catch (error) {
        devLog.error("Failed to add farm:", error);

        toast.showCustomError(
          "농장 등록 실패",
          "농장을 등록하는 중 오류가 발생했습니다."
        );
        return null;
      }
    },
    [storeFarmAdd, toast, userId]
  );

  const updateFarm = useCallback(
    async (farmId: string, values: Partial<Farm>) => {
      try {
        await storeFarmUpdate(farmId, values);
        toast.showCustomSuccess(
          "농장 수정 완료",
          "농장 정보가 성공적으로 수정되었습니다."
        );
      } catch (error) {
        devLog.error("Failed to update farm:", error);

        toast.showCustomError(
          "농장 수정 실패",
          "농장을 수정하는 중 오류가 발생했습니다."
        );
      }
    },
    [storeFarmUpdate, toast]
  );

  const deleteFarm = useCallback(
    async (farmId: string) => {
      try {
        await storeFarmDelete(farmId);
        toast.showCustomSuccess(
          "농장 삭제 완료",
          "농장이 성공적으로 삭제되었습니다."
        );
      } catch (error) {
        devLog.error("Failed to delete farm:", error);

        toast.showCustomError(
          "농장 삭제 실패",
          "농장을 삭제하는 중 오류가 발생했습니다."
        );
      }
    },
    [storeFarmDelete, toast]
  );

  const generateQRCodeUrl = useCallback((farmId: string) => {
    return `${window.location.origin}/visit/${farmId}`;
  }, []);

  return {
    farms,
    fetchState,
    fetchFarms,
    addFarm,
    updateFarm,
    deleteFarm,
    generateQRCodeUrl,
    refetch,
  };
}
