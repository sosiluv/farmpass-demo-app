import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/utils/data/api-client";
import { handleError } from "@/lib/utils/error";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logout } from "@/lib/utils/auth/authService";
import { useSubscriptionManager } from "@/hooks/useSubscriptionManager";
import { useRef } from "react";
/**
 * 로그인 액션 훅
 */
export function useSignIn() {
  const supabase = createClient();

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
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

      return { success: true, message: result.message };
    } catch (error) {
      handleError(error, { context: "sign-in" });
      throw error;
    }
  };

  return { signIn };
}

/**
 * 로그아웃 액션 훅
 */
export function useSignOut() {
  const { cleanupSubscription } = useSubscriptionManager();
  const isLoggingOutRef = useRef(false);

  const signOut = async (): Promise<{ success: boolean }> => {
    // 이미 로그아웃 중이면 스킵
    if (isLoggingOutRef.current) {
      devLog.warn("로그아웃이 이미 진행 중입니다.");
      return { success: false };
    }

    isLoggingOutRef.current = true;

    try {
      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("로그아웃 타임아웃")), 10000);
      });

      // 로그아웃 작업들을 병렬로 실행하고 타임아웃 적용
      const logoutPromise = (async () => {
        // 구독 정리 (세션 정리 전에 수행)
        try {
          await cleanupSubscription();
          devLog.log("구독 정리 수행");
        } catch (error) {
          // 구독 정리 실패해도 로그아웃은 계속 진행
          devLog.error("구독 정리 실패:", error);
        }
        // 기존 logout 유틸리티 함수 사용
        await logout(false);
      })();

      // 전체 로그아웃 작업에 타임아웃 적용
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
      } catch (error) {
        // 타임아웃이나 에러 발생 시 강제로 클라이언트 상태 정리
        devLog.warn("로그아웃 타임아웃, 강제 정리");
        await logout(true); // 강제 로그아웃으로 로컬 스토리지와 쿠키 정리
      }

      return { success: true };
    } catch (error) {
      handleError(error, { context: "sign-out" });
      await logout(true); // 강제 로그아웃으로 로컬 스토리지와 쿠키 정리
      return { success: false };
    } finally {
      // 로그아웃 완료 후 플래그 리셋
      isLoggingOutRef.current = false;
    }
  };

  return { signOut };
}

/**
 * 비밀번호 검증 액션 훅
 */
export function useVerifyPassword() {
  const supabase = createClient();

  const verifyPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
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
      handleError(error, { context: "verify-password" });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  return { verifyPassword };
}

/**
 * 비밀번호 변경 액션 훅
 */
export function useChangePassword() {
  const supabase = createClient();

  const changePassword = async ({
    newPassword,
    currentPassword,
    email,
  }: {
    newPassword: string;
    currentPassword?: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // 현재 비밀번호 검증
      if (currentPassword && email) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

        if (verifyError) {
          return {
            success: false,
            error: verifyError.message,
          };
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
      handleError(error, { context: "change-password" });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  return { changePassword };
}

/**
 * 통합 인증 액션 훅 (모든 함수를 한번에 사용할 때)
 */
export function useAuthActions() {
  const { signIn } = useSignIn();
  const { signOut } = useSignOut();
  const { verifyPassword } = useVerifyPassword();
  const { changePassword } = useChangePassword();

  return {
    signIn,
    signOut,
    verifyPassword,
    changePassword,
  };
}
