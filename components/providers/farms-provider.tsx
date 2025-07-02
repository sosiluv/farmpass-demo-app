"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useFarms } from "@/lib/hooks/use-farms";
import { devLog } from "@/lib/utils/logging/dev-logger";

interface FarmsContextValue {
  initialized: boolean;
  isLoading: boolean;
  refreshFarms: () => Promise<void>;
}

const FarmsContext = createContext<FarmsContextValue | undefined>(undefined);

export function FarmsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const profile = state.status === "authenticated" ? state.profile : null;
  const { fetchFarms, fetchState } = useFarms(profile?.id);
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
          await fetchFarms();
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
  }, [profile?.id, fetchFarms]);

  const refreshFarms = useCallback(async () => {
    if (!profile?.id) return;
    try {
      devLog.log("[FarmsProvider] Refreshing farms for user:", profile.id);
      await fetchFarms();
      devLog.log("[FarmsProvider] Farms refresh completed");
    } catch (error) {
      devLog.error("[FarmsProvider] Failed to refresh farms:", error);
    }
  }, [profile?.id, fetchFarms]);

  return (
    <FarmsContext.Provider
      value={{
        initialized: initializationRef.current === profile?.id,
        isLoading: fetchState.loading,
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
