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
import {
  createAuthLog,
  logAuthError,
  logSystemWarning,
} from "@/lib/utils/logging/system-log";
import { logUserLogin, logUserLogout } from "@/lib/utils/logging/system-log";
import { updateLoginTime } from "@/lib/auth-helpers";
import { useSubscriptionManager } from "@/hooks/useSubscriptionManager";

// 통합된 인증 상태 정의
type AuthState =
  | { status: "initializing" }
  | { status: "loading" }
  | { status: "authenticated"; session: Session; user: User; profile: Profile }
  | { status: "unauthenticated" }
  | { status: "error"; error: Error };

// 액션 타입 정의
type AuthAction =
  | { type: "SET_LOADING" }
  | {
      type: "SET_AUTHENTICATED";
      session: Session;
      user: User;
      profile: Profile;
    }
  | { type: "SET_UNAUTHENTICATED" }
  | { type: "SET_ERROR"; error: Error }
  | { type: "UPDATE_PROFILE"; profile: Profile }
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
        profile: action.profile,
      };

    case "SET_UNAUTHENTICATED":
      return { status: "unauthenticated" };

    case "SET_ERROR":
      return { status: "error", error: action.error };

    case "UPDATE_PROFILE":
      if (state.status === "authenticated") {
        return { ...state, profile: action.profile };
      }
      return state;

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
  }) => Promise<{ success: boolean }>;
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: "initializing" });
  const supabase = createClient();
  const mounted = useRef(false);
  const initialSessionLoaded = useRef(false);
  const isSigningOutRef = useRef<boolean>(false);
  const profileLoadingRef = useRef(false);

  // 구독 관리 훅 사용
  const { switchSubscription, cleanupSubscription, setupErrorListener } =
    useSubscriptionManager();

  // 프로필 로드 (단순화된 버전)
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    if (profileLoadingRef.current) {
      devLog.log("Profile loading already in progress, skipping");
      return null;
    }

    profileLoadingRef.current = true;

    try {
      devLog.log(`Loading profile for user ${userId}`);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      devLog.log("Profile loaded successfully");
      return data;
    } catch (error) {
      devLog.error("Error loading profile:", error);
      await logAuthError("PROFILE_LOAD_FAILED", error, undefined, userId);
      return null;
    } finally {
      profileLoadingRef.current = false;
    }
  };

  // 초기 세션 로드
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        dispatch({ type: "SET_LOADING" });

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session && mounted) {
          const profile = await loadProfile(session.user.id);

          if (profile && mounted) {
            dispatch({
              type: "SET_AUTHENTICATED",
              session,
              user: session.user,
              profile,
            });
          } else if (mounted) {
            dispatch({ type: "SET_UNAUTHENTICATED" });
          }
        } else if (mounted) {
          dispatch({ type: "SET_UNAUTHENTICATED" });
        }
      } catch (error) {
        devLog.error("Error initializing auth:", error);
        if (mounted) {
          dispatch({ type: "SET_ERROR", error: error as Error });
        }
      }
    };

    initializeAuth();

    // 단순화된 onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      devLog.log(`Auth state changed: ${event}`);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user && state.status !== "authenticated") {
            const profile = await loadProfile(session.user.id);
            if (profile && mounted) {
              dispatch({
                type: "SET_AUTHENTICATED",
                session,
                user: session.user,
                profile,
              });
            }
          }
          break;

        case "SIGNED_OUT":
          // signOut 함수에서 처리 중인 경우 스킵
          if (!isSigningOutRef.current && mounted) {
            devLog.log("External sign out detected");
            if (state.status === "authenticated") {
              await logUserLogout(state.user.id, state.user.email || "");
            }
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
              profile: state.profile,
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
    if (initialSessionLoaded.current) {
      // 약간의 지연을 두어 앱 초기화 완료를 명확히 표시
      const timer = setTimeout(() => {
        dispatch({ type: "APP_INITIALIZED" });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialSessionLoaded.current]);

  // 전역 에러 리스너 설정
  useEffect(() => {
    const cleanup = setupErrorListener();
    return cleanup;
  }, [setupErrorListener]);

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      dispatch({ type: "SET_LOADING" });

      // 로그인 시도 횟수 검증
      await validateLoginAttempts(email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await handleLoginFailure(email, error.message);
        throw error;
      }

      const profile = await loadProfile(data.user.id);

      if (!profile) {
        throw new Error("프로필을 불러올 수 없습니다.");
      }

      // 병렬 처리
      await Promise.all([
        updateLoginTime(data.user.id),
        resetLoginAttempts(email),
        logUserLogin(data.user.id, email, "email"),
      ]);

      // 구독 전환 (백그라운드에서 처리)
      switchSubscription(data.user.id).catch((error) => {
        devLog.warn("구독 전환 실패:", error);
        // 구독 실패해도 로그인은 계속 진행
      });

      dispatch({
        type: "SET_AUTHENTICATED",
        session: data.session,
        user: data.user,
        profile,
      });

      return { success: true };
    } catch (error) {
      devLog.error("Sign in error:", error);
      dispatch({ type: "SET_UNAUTHENTICATED" });

      if (!(error as any)?.message?.includes("Invalid login credentials")) {
        await logAuthError("SIGNIN_PROCESS_ERROR", error, email);
      }

      throw error;
    }
  };

  const signOut = async () => {
    try {
      isSigningOutRef.current = true;
      dispatch({ type: "SET_LOADING" });

      // 타임아웃 설정 (5초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("로그아웃 타임아웃")), 3000);
      });

      // 로그아웃 작업들을 병렬로 실행하고 타임아웃 적용
      const logoutPromise = (async () => {
        // 로그아웃 로그 먼저 기록
        if (state.status === "authenticated") {
          try {
            await Promise.race([
              logUserLogout(state.user.id, state.user.email || ""),
              timeoutPromise,
            ]);
          } catch (error) {
            devLog.warn("로그아웃 로그 기록 실패:", error);
          }
        }

        // 구독 정리 (세션 정리 전에 수행)
        if (state.status === "authenticated") {
          try {
            await Promise.race([cleanupSubscription(), timeoutPromise]);
            devLog.log("구독 정리 완료");
          } catch (error) {
            devLog.warn("구독 정리 실패:", error);
            // 구독 정리 실패해도 로그아웃은 계속 진행
          }
        }

        // Supabase 로그아웃
        try {
          const result = (await Promise.race([
            supabase.auth.signOut(),
            timeoutPromise,
          ])) as any;
          if (result?.error) {
            devLog.warn("Logout warning:", result.error);
          }
        } catch (error) {
          devLog.warn("Supabase 로그아웃 실패:", error);
        }
      })();

      // 전체 로그아웃 작업에 타임아웃 적용
      await Promise.race([logoutPromise, timeoutPromise]);

      // 상태 정리 (타임아웃이든 성공이든 항상 실행)
      dispatch({ type: "SET_UNAUTHENTICATED" });

      return { success: true };
    } catch (error) {
      devLog.error("SignOut error:", error);

      // 에러 발생 시에도 상태 정리
      dispatch({ type: "SET_UNAUTHENTICATED" });

      return { success: false };
    } finally {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logAuthError("PASSWORD_VERIFICATION_FAILED", error, email);
        return {
          success: false,
          error: "현재 비밀번호가 올바르지 않습니다.",
        };
      }

      await createAuthLog(
        "PASSWORD_VERIFIED",
        `비밀번호 검증 성공: ${email}`,
        email,
        data.user?.id,
        { verification_purpose: "password_change" }
      );

      return { success: true };
    } catch (error) {
      devLog.error("Password verification error:", error);
      await logAuthError("PASSWORD_VERIFICATION_PROCESS_ERROR", error, email);

      return {
        success: false,
        error: "비밀번호 검증 중 오류가 발생했습니다.",
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
        await logAuthError(
          "PASSWORD_CHANGE_ERROR",
          error,
          email,
          state.status === "authenticated" ? state.user.id : undefined
        );

        if (
          error.message ===
          "New password should be different from the old password."
        ) {
          return {
            success: false,
            error: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
          };
        }

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      devLog.error("Password change error:", error);
      await logAuthError(
        "PASSWORD_CHANGE_PROCESS_ERROR",
        error,
        email,
        state.status === "authenticated" ? state.user.id : undefined
      );

      return {
        success: false,
        error: "비밀번호 변경 중 오류가 발생했습니다.",
      };
    }
  };

  const refreshProfile = async () => {
    if (state.status === "authenticated") {
      const profile = await loadProfile(state.user.id);
      if (profile) {
        dispatch({ type: "UPDATE_PROFILE", profile });
      }
    }
  };

  // 헬퍼 함수들 (기존과 동일하지만 단순화)
  const validateLoginAttempts = async (email: string) => {
    try {
      const response = await fetch(
        `/api/auth/validate-login-attempts?email=${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (!data.allowed) {
          throw new Error(data.message);
        }
      }
    } catch (error) {
      await logAuthError("LOGIN_VALIDATION_ERROR", error, email);
    }
  };

  const handleLoginFailure = async (email: string, errorMessage: string) => {
    try {
      if (errorMessage === "Email not confirmed") {
        await createAuthLog(
          "LOGIN_BLOCKED_EMAIL_NOT_CONFIRMED",
          `이메일 미인증으로 로그인 차단: ${email}`,
          email,
          undefined,
          { error_message: errorMessage }
        );
        return;
      }

      await fetch("/api/auth/login-failed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      await createAuthLog(
        "LOGIN_ATTEMPT_FAILED",
        `로그인 시도 실패: ${email} - ${errorMessage}`,
        email,
        undefined,
        { error_message: errorMessage }
      );
    } catch (error) {
      devLog.error("로그인 실패 기록 중 오류:", error);
      await logAuthError("LOGIN_FAILURE_RECORD_ERROR", error, email);
    }
  };

  const resetLoginAttempts = async (email: string) => {
    try {
      await fetch("/api/auth/reset-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      devLog.error("Failed to reset login attempts:", error);
    }
  };

  const value = {
    state,
    signIn,
    signOut,
    verifyPassword,
    changePassword,
    refreshProfile,
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
