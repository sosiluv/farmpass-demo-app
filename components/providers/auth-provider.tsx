"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { apiClient } from "@/lib/utils/data/api-client";
import { useSubscriptionManager } from "@/hooks/useSubscriptionManager";
import { handleError } from "@/lib/utils/error";
import { logout } from "@/lib/utils/auth/authService";

// 통합된 인증 상태 정의
type AuthState =
  | { status: "initializing" }
  | { status: "loading" }
  | { status: "authenticated"; session: Session; user: User }
  | { status: "unauthenticated" }
  | { status: "error"; error: Error };

// 액션 타입 정의
type AuthAction =
  | { type: "SET_LOADING" }
  | {
      type: "SET_AUTHENTICATED";
      session: Session;
      user: User;
    }
  | { type: "SET_UNAUTHENTICATED" }
  | { type: "SET_ERROR"; error: Error }
  | { type: "APP_INITIALIZED" };

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

    case "SET_ERROR":
      return { status: "error", error: action.error };

    case "APP_INITIALIZED":
      if (state.status === "initializing") {
        return { status: "unauthenticated" };
      }
      return state;

    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  signIn: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<{ success: boolean }>;
  verifyPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: {
    newPassword: string;
    currentPassword?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: "initializing" });
  const supabase = createClient();
  const initialSessionLoaded = useRef(false);
  const isSigningOutRef = useRef<boolean>(false);

  // 구독 관리 훅 사용 - Lazy Loading으로 최적화
  const { switchSubscription, cleanupSubscription } = useSubscriptionManager();

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
              devLog.warn("세션은 있지만 유저 정보 검증 실패, 로그아웃 처리");
              await logout(true); // 강제 로그아웃으로 클라이언트 상태 정리
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
            await logout(true); // 강제 로그아웃으로 클라이언트 상태 정리
            if (mounted) {
              dispatch({ type: "SET_UNAUTHENTICATED" });
            }
          }
        } else if (mounted) {
          dispatch({ type: "SET_UNAUTHENTICATED" });
        }
      } catch (error) {
        if (mounted) {
          // 모든 초기화 오류의 경우 클라이언트 상태를 정리하고 unauthenticated로 처리
          devLog.warn("초기화 중 오류 발생, 클라이언트 상태 정리:", error);

          try {
            await logout(true); // 강제 로그아웃으로 클라이언트 상태 정리
          } catch (logoutError) {
            devLog.error("초기화 오류 시 로그아웃 실패:", logoutError);
          }

          // 네트워크 관련 에러의 경우 unauthenticated로 처리
          if (
            error instanceof Error &&
            (error.message.includes("타임아웃") ||
              error.message.includes("network") ||
              error.message.includes("fetch"))
          ) {
            devLog.warn(
              "Network error during initialization, setting unauthenticated"
            );
            dispatch({ type: "SET_UNAUTHENTICATED" });
          } else {
            dispatch({ type: "SET_ERROR", error: error as Error });
          }
        }
      } finally {
        // 초기 세션 로드 완료 표시
        if (mounted) {
          initialSessionLoaded.current = true;
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
          // signOut 함수에서 처리 중인 경우 스킵
          if (!isSigningOutRef.current && mounted) {
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

  // 앱 초기화 완료 감지
  useEffect(() => {
    if (initialSessionLoaded.current && state.status === "initializing") {
      // 지연 최소화
      const timer = setTimeout(() => {
        dispatch({ type: "APP_INITIALIZED" });
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [initialSessionLoaded.current, state.status]);

  // 배포 환경에서 무한 로딩 방지를 위한 안전장치
  useEffect(() => {
    if (state.status === "initializing") {
      const failsafeTimer = setTimeout(() => {
        dispatch({ type: "SET_UNAUTHENTICATED" });
      }, 10000); // 10초 후 강제로 unauthenticated 상태로 전환

      return () => clearTimeout(failsafeTimer);
    }
  }, [state.status]);

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      dispatch({ type: "SET_LOADING" });

      // 새로운 통합 로그인 API 사용
      const result = await apiClient("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        context: "로그인",
      });

      if (!result.success) {
        // 에러 메시지/코드만 throw (timeLeft 등 추가 정보는 제거)
        throw new Error(
          result.message || result.error || "로그인에 실패했습니다."
        );
      }

      // 로그인 성공 시 세션 정보 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("세션 정보를 가져올 수 없습니다.");
      }

      dispatch({
        type: "SET_AUTHENTICATED",
        session: session,
        user: session.user,
      });

      return { success: true, message: result.message };
    } catch (error) {
      devLog.error("Sign in error:", error);
      handleError(error, { context: "sign-in" });
      dispatch({ type: "SET_UNAUTHENTICATED" });

      throw error;
    }
  };

  const signOut = async () => {
    try {
      isSigningOutRef.current = true;
      dispatch({ type: "SET_LOADING" });

      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("로그아웃 타임아웃")), 10000);
      });

      // 로그아웃 작업들을 병렬로 실행하고 타임아웃 적용
      const logoutPromise = (async () => {
        // 구독 정리 (세션 정리 전에 수행)
        if (state.status === "authenticated") {
          try {
            await cleanupSubscription();
          } catch (error) {
            devLog.warn("구독 정리 실패:", error);
            // 구독 정리 실패해도 로그아웃은 계속 진행
          }
        }

        // Supabase 로그아웃
        try {
          await logout(false);
        } catch (error) {
          devLog.warn("Supabase 로그아웃 실패:", error);
        }
      })();

      // 전체 로그아웃 작업에 타임아웃 적용
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
      } catch (error) {
        devLog.warn("로그아웃 타임아웃 또는 실패:", error);
        // 타임아웃이나 에러 발생 시 강제로 클라이언트 상태 정리
        await logout(true); // 강제 로그아웃으로 로컬 스토리지와 쿠키 정리
      }

      return { success: true };
    } catch (error) {
      devLog.error("SignOut error:", error);
      handleError(error, { context: "sign-out" });

      // 에러 발생 시에도 강제로 클라이언트 상태 정리
      try {
        await logout(true); // 강제 로그아웃으로 로컬 스토리지와 쿠키 정리
      } catch (cleanupError) {
        devLog.error("강제 정리 실패:", cleanupError);
      }

      return { success: false };
    } finally {
      // 상태 정리 (타임아웃이든 성공이든 에러든 항상 실행)
      dispatch({ type: "SET_UNAUTHENTICATED" });
      isSigningOutRef.current = false;
    }
  };

  const verifyPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      devLog.error("Password verification error:", error);
      handleError(error, { context: "verify-password" });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const changePassword = async ({
    newPassword,
    currentPassword,
    email,
  }: {
    newPassword: string;
    currentPassword?: string;
    email?: string;
  }) => {
    try {
      // 현재 비밀번호 검증
      if (currentPassword && email) {
        const verification = await verifyPassword({
          email,
          password: currentPassword,
        });
        if (!verification.success) {
          return verification;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      devLog.error("Password change error:", error);
      handleError(error, { context: "change-password" });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const value = {
    state,
    signIn,
    signOut,
    verifyPassword,
    changePassword,
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
