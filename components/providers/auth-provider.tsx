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
  const initialSessionLoaded = useRef(false);
  const isSigningOutRef = useRef<boolean>(false);
  const profileLoadingPromise = useRef<Promise<Profile | null> | null>(null);

  // 구독 관리 훅 사용 (VAPID key는 불필요)
  const { switchSubscription, cleanupSubscription, setupErrorListener } =
    useSubscriptionManager(false);

  // 프로필 로드 (최적화된 버전)
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    // 중복 요청 방지: 이미 진행 중인 요청이 있으면 그 결과를 기다림
    if (profileLoadingPromise.current) {
      return await profileLoadingPromise.current;
    }

    // 새로운 프로필 로딩 시작
    const loadingPromise = (async (): Promise<Profile | null> => {
      try {
        // 타임아웃과 프로필 조회를 동시에 실행 (타임아웃 단축)
        const { data, error } = await Promise.race([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("프로필 로딩 타임아웃")), 3000)
          ),
        ]);

        if (error) throw error;
        return data;
      } catch (error) {
        // 타임아웃이나 네트워크 에러는 조용히 처리
        if (error instanceof Error && error.message.includes("타임아웃")) {
          return null;
        }
        // 기타 에러는 로그 기록
        devLog.warn("Profile loading error:", error);
        return null;
      } finally {
        // 메모리 누수 방지: 로딩 완료 후 Promise 초기화
        profileLoadingPromise.current = null;
      }
    })();

    // 현재 요청을 저장하여 중복 방지
    profileLoadingPromise.current = loadingPromise;
    return await loadingPromise;
  };

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

            const profile = await loadProfile(session.user.id);

            if (profile && mounted) {
              dispatch({
                type: "SET_AUTHENTICATED",
                session,
                user: session.user,
                profile,
              });
            } else if (mounted) {
              devLog.warn("프로필 로드 실패, 로그아웃 처리");
              await logout(true); // 강제 로그아웃으로 클라이언트 상태 정리
              dispatch({ type: "SET_UNAUTHENTICATED" });
            }
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
            if (state.status === "authenticated") {
              // 구독 정리 (세션 정리 전에 수행)
              try {
                await cleanupSubscription();
              } catch (error) {
                devLog.warn("SIGNED_OUT 이벤트 중 구독 정리 실패:", error);
              }
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

      // 새로운 통합 로그인 API 사용
      const result = await apiClient("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        context: "로그인",
        onError: (error, context) => {
          handleError(error, context);
        },
      });

      if (!result.success) {
        // 로그인 실패 시 에러 처리
        if (result.status === 429) {
          // 계정 잠금
          throw new Error(result.message || "계정이 잠겼습니다.");
        } else if (result.status === 401) {
          // 인증 실패
          throw new Error(
            result.message || "이메일 또는 비밀번호가 올바르지 않습니다."
          );
        } else {
          // 기타 오류
          throw new Error(result.error || "로그인에 실패했습니다.");
        }
      }

      // 로그인 성공 시 세션 정보 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("세션 정보를 가져올 수 없습니다.");
      }

      // 프로필 로드
      let profile = await loadProfile(session.user.id);

      if (!profile) {
        // 프로필 로딩 실패 시 한 번 더 시도
        devLog.warn("첫 번째 프로필 로딩 실패, 재시도 중...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
        const retryProfile = await loadProfile(session.user.id);

        if (!retryProfile) {
          throw new Error(
            "프로필을 불러올 수 없습니다. 네트워크 상태를 확인하고 다시 시도해주세요."
          );
        }

        // 재시도 성공
        profile = retryProfile;
      }

      // 구독 전환 (백그라운드에서 처리)
      switchSubscription(session.user.id).catch((error: any) => {
        devLog.warn("구독 전환 실패:", error);
        // 구독 실패해도 로그인은 계속 진행
      });

      dispatch({
        type: "SET_AUTHENTICATED",
        session: session,
        user: session.user,
        profile,
      });

      return { success: true };
    } catch (error) {
      devLog.error("Sign in error:", error);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: "현재 비밀번호가 올바르지 않습니다.",
        };
      }

      return { success: true };
    } catch (error) {
      devLog.error("Password verification error:", error);

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
