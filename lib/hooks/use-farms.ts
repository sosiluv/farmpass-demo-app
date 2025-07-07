"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFarmsStore } from "@/store/use-farms-store";
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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // userId를 ref로 관리하여 useCallback 의존성에서 제거
  const userIdRef = useRef<string | undefined>(userId);
  userIdRef.current = userId;

  const fetchFarms = useCallback(
    async (targetUserId?: string, forceRefetch: boolean = false) => {
      const userIdToUse = targetUserId || userIdRef.current;

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
        setError("농장 목록을 불러오는 중 오류가 발생했습니다.");
        return;
      }

      try {
        setError(null);
        isFetchingRef.current = true;
        lastUserIdRef.current = userIdToUse;

        devLog.log(`Fetching farms for userId: ${userIdToUse}`);
        await storeFetchFarms(userIdToUse);
        hasDataRef.current = true;
      } catch (error) {
        devLog.error("Failed to fetch farms:", error);
        hasDataRef.current = false;
        setError("농장 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        isFetchingRef.current = false;
      }
    },
    [storeFetchFarms] // userId를 의존성에서 제거
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

  // userId 변경 시에만 fetchFarms 호출
  useEffect(() => {
    if (userId === undefined || userId === null) {
      return;
    }
    fetchFarms();
  }, [userId]); // fetchFarms를 의존성에서 제거

  const addFarm = useCallback(
    async (values: FarmFormValues, targetUserId?: string) => {
      const userIdToUse = targetUserId || userIdRef.current;
      if (!userIdToUse) {
        devLog.error("[useFarms] userId 없이 농장 등록 시도");
        setError("농장을 등록할 권한이 없습니다.");
        return null;
      }

      try {
        setError(null);
        const farm = await storeFarmAdd(userIdToUse, values);
        if (farm) {
          setSuccessMessage("농장이 성공적으로 등록되었습니다.");
        }
        return farm;
      } catch (error) {
        devLog.error("Failed to add farm:", error);
        setError("농장을 등록하는 중 오류가 발생했습니다.");
        return null;
      }
    },
    [storeFarmAdd] // userId를 의존성에서 제거
  );

  const updateFarm = useCallback(
    async (farmId: string, values: Partial<Farm>) => {
      try {
        setError(null);
        await storeFarmUpdate(farmId, values);
        setSuccessMessage("농장 정보가 성공적으로 수정되었습니다.");
      } catch (error) {
        devLog.error("Failed to update farm:", error);
        setError("농장을 수정하는 중 오류가 발생했습니다.");
      }
    },
    [storeFarmUpdate]
  );

  const deleteFarm = useCallback(
    async (farmId: string) => {
      try {
        setError(null);
        await storeFarmDelete(farmId);
        setSuccessMessage("농장이 성공적으로 삭제되었습니다.");
      } catch (error) {
        devLog.error("Failed to delete farm:", error);
        setError("농장을 삭제하는 중 오류가 발생했습니다.");
      }
    },
    [storeFarmDelete]
  );

  const generateQRCodeUrl = useCallback((farmId: string) => {
    return `${window.location.origin}/visit/${farmId}`;
  }, []);

  // 메시지 초기화 함수
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    farms,
    fetchState,
    error,
    successMessage,
    fetchFarms,
    addFarm,
    updateFarm,
    deleteFarm,
    generateQRCodeUrl,
    refetch,
    clearMessages,
  };
}
