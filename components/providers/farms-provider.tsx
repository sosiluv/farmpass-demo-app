"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useFarmsQuery } from "@/lib/hooks/query/use-farms-query";
import { devLog } from "@/lib/utils/logging/dev-logger";
import type { Farm } from "@/lib/types/farm";

interface FarmsContextValue {
  farms: Farm[];
  initialized: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  refreshFarms: () => Promise<void>;
}

const FarmsContext = createContext<FarmsContextValue | undefined>(undefined);

export function FarmsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const {
    farms,
    refetch: refetchFarms,
    isLoading,
    isError,
    error,
  } = useFarmsQuery(profile?.id);
  const initializationRef = useRef<string | null>(null);

  // 초기화 로직 개선
  useEffect(() => {
    if (!profile?.id) {
      // 사용자가 로그아웃한 경우 초기화 상태 리셋
      initializationRef.current = null;
      return;
    }

    // 새로운 사용자 ID인 경우에만 초기화
    if (initializationRef.current !== profile.id) {
      const initializeFarms = async () => {
        try {
          devLog.log(
            "[FarmsProvider] Initializing farms for user:",
            profile.id
          );
          await refetchFarms();
          initializationRef.current = profile.id;
          devLog.log("[FarmsProvider] Farms initialization completed");
        } catch (error) {
          devLog.error("[FarmsProvider] Failed to initialize farms:", error);
          // 초기화 실패 시 상태 리셋하여 재시도 가능하도록 함
          initializationRef.current = null;
        }
      };

      initializeFarms();
    }
  }, [profile?.id, refetchFarms]);

  const refreshFarms = useCallback(async () => {
    if (!profile?.id) return;
    try {
      devLog.log("[FarmsProvider] Refreshing farms for user:", profile.id);
      await refetchFarms();
      devLog.log("[FarmsProvider] Farms refresh completed");
    } catch (error) {
      devLog.error("[FarmsProvider] Failed to refresh farms:", error);
    }
  }, [profile?.id, refetchFarms]);

  return (
    <FarmsContext.Provider
      value={{
        farms,
        initialized: initializationRef.current === profile?.id,
        isLoading: isLoading,
        isError,
        error,
        refetch: refetchFarms,
        refreshFarms,
      }}
    >
      {children}
    </FarmsContext.Provider>
  );
}

export const useFarmsContext = () => {
  const context = useContext(FarmsContext);
  if (!context) {
    throw new Error("useFarmsContext must be used within a FarmsProvider");
  }
  return context;
};
