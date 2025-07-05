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
import { handleError } from "@/lib/utils/error";
import { useSubscriptionManager } from "@/hooks/useSubscriptionManager";
import { apiClient } from "@/lib/utils/data";

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
  const profileLoadingPromise = useRef<Promise<Profile | null> | null>(null);

  // 구독 관리 훅 사용 (로그아웃은 authService에서 처리)
  const { switchSubscription, setupErrorListener } = useSubscriptionManager();

  // 프로필 로드 (개선된 버전)
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    // 이미 진행 중인 요청이 있으면 그 결과를 기다림
    if (profileLoadingPromise.current) {
      devLog.log("Profile loading already in progress, waiting for completion");
      return await profileLoadingPromise.current;
    }

    // 새로운 프로필 로딩 시작
    const loadingPromise = (async (): Promise<Profile | null> => {
      try {
        devLog.log(`Loading profile for user ${userId}`);

        // 배포 환경에서 프로필 로딩 타임아웃 설정
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("프로필 로딩 타임아웃")), 5000)
        );

        const profilePromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const { data, error } = await Promise.race([
          profilePromise,
          timeoutPromise,
        ]);

        if (error) throw error;

        devLog.log("Profile loaded successfully");
        return data;
      } catch (error) {
        // 타임아웃이나 네트워크 에러의 경우 로그 기록하지 않음
        if (!(error instanceof Error && error.message.includes("타임아웃"))) {
          // 네트워크 관련 에러의 경우 unauthenticated로 처리
          devLog.warn(
            "Network error during initialization, setting unauthenticated"
          );
          return null;
        }
        return null;
      } finally {
        // 로딩 완료 후 Promise 초기화
        profileLoadingPromise.current = null;
      }
    })();

    profileLoadingPromise.current = loadingPromise;
    return await loadingPromise;
  };

  // 초기 세션 로드
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        dispatch({ type: "SET_LOADING" });

        // 배포 환경에서 네트워크 지연을 고려한 타임아웃 설정
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("사용자 확인 타임아웃")), 10000)
        );

        // getUser()를 사용하여 서버에서 실시간 검증
        const userPromise = supabase.auth.getUser();

        const {
          data: { user },
          error,
        } = (await Promise.race([userPromise, timeoutPromise])) as any;

        if (error) throw error;

        if (user && mounted) {
          devLog.log("User authenticated, loading profile...");
          const profile = await loadProfile(user.id);

          if (profile && mounted) {
            devLog.log(
              "Profile loaded successfully, setting authenticated state"
            );

            // 세션 정보도 필요하므로 getSession() 호출 (상태 관리용)
            const {
              data: { session },
            } = await supabase.auth.getSession();

            dispatch({
              type: "SET_AUTHENTICATED",
              session: session || ({} as Session), // 세션이 없으면 빈 객체
              user,
              profile,
            });
          } else if (mounted) {
            devLog.warn("Profile loading failed, setting unauthenticated");
            dispatch({ type: "SET_UNAUTHENTICATED" });
          }
        } else if (mounted) {
          devLog.log("No user found, setting unauthenticated");
          dispatch({ type: "SET_UNAUTHENTICATED" });
        }
      } catch (error) {
        devLog.error("Error initializing auth:", error);
        if (mounted) {
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

      devLog.log(`Auth state changed: ${event}`);

      switch (event) {
        case "SIGNED_IN":
          // signIn 함수에서 이미 처리 중이거나 이미 인증된 상태면 스킵
          if (
            session?.user &&
            state.status !== "authenticated" &&
            state.status !== "loading"
          ) {
            // 서버에서 사용자 정보 재검증
            try {
              const {
                data: { user },
                error,
              } = await supabase.auth.getUser();
              if (error || !user) {
                devLog.warn("User verification failed during SIGNED_IN event");
                return;
              }

              const profile = await loadProfile(user.id);
              if (profile && mounted) {
                dispatch({
                  type: "SET_AUTHENTICATED",
                  session,
                  user,
                  profile,
                });
              }
            } catch (error) {
              devLog.error("Error verifying user during SIGNED_IN:", error);
            }
          }
          break;

        case "SIGNED_OUT":
          // signOut 함수에서 처리 중인 경우 스킵
          if (!isSigningOutRef.current && mounted) {
            devLog.log("External sign out detected");
            // 구독 정리는 authService에서 처리하므로 여기서는 상태만 변경
            dispatch({ type: "SET_UNAUTHENTICATED" });
          }
          break;

        case "TOKEN_REFRESHED":
          // 토큰 갱신 시에도 사용자 정보 재검증
          if (session && state.status === "authenticated" && mounted) {
            try {
              const {
                data: { user },
                error,
              } = await supabase.auth.getUser();
              if (error || !user) {
                devLog.warn(
                  "User verification failed during TOKEN_REFRESHED event"
                );
                dispatch({ type: "SET_UNAUTHENTICATED" });
                return;
              }

              dispatch({
                type: "SET_AUTHENTICATED",
                session,
                user,
                profile: state.profile,
              });
            } catch (error) {
              devLog.error(
                "Error verifying user during TOKEN_REFRESHED:",
                error
              );
              dispatch({ type: "SET_UNAUTHENTICATED" });
            }
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
      // 약간의 지연을 두어 앱 초기화 완료를 명확히 표시
      const timer = setTimeout(() => {
        devLog.log("Dispatching APP_INITIALIZED action");
        dispatch({ type: "APP_INITIALIZED" });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialSessionLoaded.current, state.status]);

  // 배포 환경에서 무한 로딩 방지를 위한 안전장치
  useEffect(() => {
    if (state.status === "initializing") {
      const failsafeTimer = setTimeout(() => {
        devLog.warn("Failsafe: Force setting unauthenticated after 15 seconds");
        dispatch({ type: "SET_UNAUTHENTICATED" });
      }, 15000); // 15초 후 강제로 unauthenticated 상태로 전환

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
          // 인증 실패 - 로그인 API의 401은 세션 만료가 아닌 인증 실패
          throw new Error(
            result.message || "이메일 또는 비밀번호가 올바르지 않습니다."
          );
        } else {
          // 기타 오류
          throw new Error(result.error || "로그인에 실패했습니다.");
        }
      }

      // API에서 반환된 세션 정보 사용
      const session = result.session;
      if (!session) {
        throw new Error("세션 정보를 가져올 수 없습니다.");
      }

      // 사용자 정보 안전하게 추출
      if (!result.user || !result.user.id) {
        throw new Error("사용자 정보를 가져올 수 없습니다.");
      }

      // 세션 쿠키가 이미 설정되었으므로 별도 세션 설정 불필요
      // 원본 세션 객체 사용
      const clientSession = session;

      // 프로필 로드 최적화 - 즉시 재시도 (대기 시간 제거)
      let profile = await loadProfile(result.user.id);

      if (!profile) {
        // 즉시 재시도 (1초 대기 제거)
        devLog.warn("첫 번째 프로필 로딩 실패, 즉시 재시도 중...");
        const retryProfile = await loadProfile(result.user.id);

        if (!retryProfile) {
          // 백그라운드에서 프로필 로드 시도
          devLog.warn("프로필 로딩 실패, 백그라운드에서 재시도...");
          loadProfile(result.user.id)
            .then((bgProfile) => {
              if (bgProfile) {
                dispatch({ type: "UPDATE_PROFILE", profile: bgProfile });
              }
            })
            .catch((error) => {
              devLog.warn("Background profile loading failed:", error);
            });

          // 프로필 로드 실패 시 에러를 던지지 않고 기본값 사용
          throw new Error(
            "프로필을 불러올 수 없습니다. 네트워크 상태를 확인하고 다시 시도해주세요."
          );
        } else {
          profile = retryProfile;
        }
      }

      // 구독 전환 (백그라운드에서 처리)
      switchSubscription(result.user.id).catch((error) => {
        devLog.warn("구독 전환 실패:", error);
        // 구독 실패해도 로그인은 계속 진행
      });

      dispatch({
        type: "SET_AUTHENTICATED",
        session: clientSession,
        user: result.user,
        profile,
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: "SET_UNAUTHENTICATED" });

      throw error;
    }
  };

  const signOut = async () => {
    try {
      isSigningOutRef.current = true;
      dispatch({ type: "SET_LOADING" });

      // AuthService 사용 (내부에서 구독 정리까지 처리)
      const { logout } = await import("@/lib/utils/auth");
      await logout(false);

      dispatch({ type: "SET_UNAUTHENTICATED" });
      return { success: true };
    } catch (error) {
      devLog.error("SignOut error:", error);
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
