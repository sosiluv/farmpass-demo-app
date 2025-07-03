"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFarmsStore } from "@/store/use-farms-store";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError, logSystemWarning } from "@/lib/utils/logging/system-log";
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
        await logSystemWarning("farms_fetch", "사용자 ID 없이 농장 조회 시도", {
          resource: "farm",
          action: "fetchFarms",
        });
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

        await logApiError(
          "/api/farms",
          "GET",
          error instanceof Error ? error : String(error),
          userIdToUse
        );

        toast.showError("FARM_FETCH_FAILED");
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
        toast.showCustomError("권한 없음", "농장을 등록할 권한이 없습니다.");
        return null;
      }

      try {
        const farm = await storeFarmAdd(userIdToUse, values);
        if (farm) {
          toast.showSuccess("FARM_CREATED");
        }
        return farm;
      } catch (error) {
        devLog.error("Failed to add farm:", error);

        // 농장 생성 API 에러 로그
        await logApiError(
          "/api/farms",
          "POST",
          error instanceof Error ? error : String(error),
          userIdToUse
        );

        toast.showError("FARM_CREATE_FAILED");
        return null;
      }
    },
    [storeFarmAdd, toast, userId]
  );

  const updateFarm = useCallback(
    async (farmId: string, values: Partial<Farm>) => {
      try {
        await storeFarmUpdate(farmId, values);
        toast.showSuccess("FARM_UPDATED");
      } catch (error) {
        devLog.error("Failed to update farm:", error);

        // 농장 수정 API 에러 로그
        await logApiError(
          `/api/farms/${farmId}`,
          "PUT",
          error instanceof Error ? error : String(error),
          userId
        );

        toast.showError("FARM_UPDATE_FAILED");
      }
    },
    [storeFarmUpdate, toast]
  );

  const deleteFarm = useCallback(
    async (farmId: string) => {
      try {
        await storeFarmDelete(farmId);
        toast.showSuccess("FARM_DELETED");
      } catch (error) {
        devLog.error("Failed to delete farm:", error);

        // 농장 삭제 API 에러 로그
        await logApiError(
          `/api/farms/${farmId}`,
          "DELETE",
          error instanceof Error ? error : String(error),
          userId
        );

        toast.showError("FARM_DELETE_FAILED");
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
