"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { useSubscriptionManager } from "@/hooks/useSubscriptionManager";
// React Query 캐시 정리를 위한 import
import { useQueryClient } from "@tanstack/react-query";
import {
  profileKeys,
  farmsKeys,
  notificationKeys,
  visitorsKeys,
} from "@/lib/hooks/query/query-keys";

// 통합된 인증 상태 정의
type AuthState =
  | { status: "initializing" }
  | { status: "loading" }
  | { status: "authenticated"; session: Session; user: User }
  | { status: "unauthenticated" };

// 액션 타입 정의
type AuthAction =
  | { type: "SET_LOADING" }
  | {
      type: "SET_AUTHENTICATED";
      session: Session;
      user: User;
    }
  | { type: "SET_UNAUTHENTICATED" };

// 리듀서
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { status: "loading" };

    case "SET_AUTHENTICATED":
      return {
        status: "authenticated",
        session: action.session,
        user: action.user,
      };

    case "SET_UNAUTHENTICATED":
      return { status: "unauthenticated" };

    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: "initializing" });
  const supabase = createClient();

  // 구독 관리 훅 사용 - Lazy Loading으로 최적화
  const { switchSubscription } = useSubscriptionManager();

  // React Query 캐시 정리를 위한 queryClient
  const queryClient = useQueryClient();

  // 인증 상태 변경 시 관련 캐시 초기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: farmsKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: visitorsKeys.all });
    }
  }, [
    state.status,
    state.status === "authenticated" ? state.user?.id : undefined,
    queryClient,
  ]);

  // 초기 세션 로드
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        dispatch({ type: "SET_LOADING" });

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && mounted) {
          // 추가 세션 유효성 검증
          try {
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            // 세션은 있지만 유저 정보를 가져올 수 없으면 세션이 유효하지 않음
            if (error || !user) {
              devLog.warn("세션은 있지만 유저 정보 검증 실패");
              if (mounted) {
                dispatch({ type: "SET_UNAUTHENTICATED" });
              }
              return;
            }

            // profile 로드는 더 이상 필요 없으므로 제거
            dispatch({
              type: "SET_AUTHENTICATED",
              session,
              user: session.user,
            });
            // ✅ 최초 세션 로드 시에도 구독 전환 시도
            switchSubscription(session.user.id).catch((error) => {
              devLog.error("구독 전환 실패:", error);
            });
          } catch (userError) {
            devLog.warn("사용자 정보 검증 중 오류:", userError);
            if (mounted) {
              dispatch({ type: "SET_UNAUTHENTICATED" });
            }
          }
        } else if (mounted) {
          dispatch({ type: "SET_UNAUTHENTICATED" });
        }
      } catch (error) {
        if (mounted) {
          devLog.warn("초기화 중 오류 발생:", error);
          dispatch({ type: "SET_UNAUTHENTICATED" });
        }
      }
    };

    initializeAuth();

    // 단순화된 onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      switch (event) {
        case "SIGNED_IN":
          // signIn 함수에서 이미 처리 중이거나 이미 인증된 상태면 스킵
          if (
            session?.user &&
            state.status !== "authenticated" &&
            state.status !== "loading"
          ) {
            // profile 로드는 더 이상 필요 없으므로 제거
            dispatch({
              type: "SET_AUTHENTICATED",
              session,
              user: session.user,
            });
          }
          break;

        case "SIGNED_OUT":
          if (mounted) {
            dispatch({ type: "SET_UNAUTHENTICATED" });
          }
          break;

        case "TOKEN_REFRESHED":
          // 토큰 갱신은 세션만 업데이트 (로깅 제거)
          if (session && state.status === "authenticated" && mounted) {
            dispatch({
              type: "SET_AUTHENTICATED",
              session,
              user: state.user,
            });
          }
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 배포 환경에서 무한 로딩 방지를 위한 안전장치
  useEffect(() => {
    if (state.status === "initializing") {
      const failsafeTimer = setTimeout(() => {
        dispatch({ type: "SET_UNAUTHENTICATED" });
      }, 10000); // 10초 후 강제로 unauthenticated 상태로 전환

      return () => clearTimeout(failsafeTimer);
    }
  }, [state.status]);

  const value = {
    state,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
