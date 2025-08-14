import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
} from "@/lib/utils/error/errorUtil";

/**
 * 시스템 관리자 권한 확인 유틸리티
 */

export interface AdminCheckResult {
  isAdmin: boolean;
  user: User;
  error?: string;
}

export interface AuthCheckResult {
  user: User | null;
  error?: string;
}

/**
 * 인증된 사용자 정보를 가져오는 함수
 * @returns 사용자 정보 또는 에러
 */
export async function getAuthenticatedUser(): Promise<AuthCheckResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { user: null, error: "UNAUTHORIZED" };
    }

    if (!user) {
      return { user: null, error: "UNAUTHORIZED" };
    }

    return { user };
  } catch (error) {
    return {
      user: null,
      error: "UNKNOWN_ERROR",
    };
  }
}

/**
 * 시스템 관리자 권한을 확인하는 함수
 * @param userId - 확인할 사용자 ID (선택사항, 없으면 현재 인증된 사용자 사용)
 * @returns 관리자 여부와 사용자 정보
 */
export async function checkSystemAdmin(
  userId?: string
): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient();
    let user: User;

    if (userId) {
      // 특정 사용자 ID로 확인 (이미 인증된 상태에서 사용)
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user || authData.user.id !== userId) {
        return {
          isAdmin: false,
          user: authData.user as User,
          error: "USER_MISMATCH_OR_AUTHENTICATION_FAILED",
        };
      }
      user = authData.user;
    } else {
      // 현재 인증된 사용자로 확인
      const authResult = await getAuthenticatedUser();
      if (!authResult.user) {
        return {
          isAdmin: false,
          user: null as any,
          error: authResult.error || "UNAUTHORIZED",
        };
      }
      user = authResult.user;
    }

    // app_metadata에서 isAdmin 확인
    const isAdmin = user.app_metadata?.isAdmin === true;

    return { isAdmin, user };
  } catch (error) {
    return {
      isAdmin: false,
      user: null as any,
      error: "UNKNOWN_ERROR",
    };
  }
}

/**
 * 시스템 관리자 또는 특정 조건을 만족하는지 확인하는 함수
 * @param userId - 확인할 사용자 ID
 * @param additionalCheck - 관리자가 아닐 때 추가로 확인할 조건 함수
 * @returns 권한 여부
 */
export async function checkAdminOrCondition(
  userId: string,
  additionalCheck: (user: User) => Promise<boolean>
): Promise<{
  hasPermission: boolean;
  user: User;
  isAdmin: boolean;
  error?: string;
}> {
  const adminResult = await checkSystemAdmin(userId);

  if (adminResult.error) {
    return {
      hasPermission: false,
      user: adminResult.user,
      isAdmin: false,
      error: adminResult.error,
    };
  }

  // 관리자인 경우 즉시 허용
  if (adminResult.isAdmin) {
    return {
      hasPermission: true,
      user: adminResult.user,
      isAdmin: true,
    };
  }

  // 관리자가 아닌 경우 추가 조건 확인
  try {
    const hasAdditionalPermission = await additionalCheck(adminResult.user);
    return {
      hasPermission: hasAdditionalPermission,
      user: adminResult.user,
      isAdmin: false,
    };
  } catch (error) {
    return {
      hasPermission: false,
      user: adminResult.user,
      isAdmin: false,
      error: "ADDITIONAL_CHECK_FAILED",
    };
  }
}

/**
 * Express/Next.js API 라우트에서 사용하기 쉬운 미들웨어 스타일 함수
 * @param requireAdmin - true면 관리자만 허용, false면 인증된 사용자만 허용
 * @returns 인증 결과와 NextResponse (에러 시)
 */
export async function requireAuth(requireAdmin: boolean = false): Promise<{
  success: boolean;
  user?: User;
  isAdmin?: boolean;
  response?: Response;
}> {
  const authResult = await getAuthenticatedUser();

  if (!authResult.user) {
    const result = getErrorResultFromRawError({ businessCode: "UNAUTHORIZED" });
    const errorResponse = makeErrorResponseFromResult(result);
    return {
      success: false,
      response: new Response(JSON.stringify(errorResponse), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  if (!requireAdmin) {
    // 관리자 여부를 확인하되, 관리자가 아니어도 허용
    const adminResult = await checkSystemAdmin(authResult.user.id);
    return {
      success: true,
      user: authResult.user,
      isAdmin: adminResult.isAdmin,
    };
  }

  const adminResult = await checkSystemAdmin(authResult.user.id);

  if (adminResult.error) {
    const result = getErrorResultFromRawError({
      businessCode: adminResult.error,
    });
    const errorResponse = makeErrorResponseFromResult(result);
    return {
      success: false,
      response: new Response(JSON.stringify(errorResponse), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  if (!adminResult.isAdmin) {
    const result = getErrorResultFromRawError({
      businessCode: "ADMIN_ACCESS_REQUIRED",
    });
    const errorResponse = makeErrorResponseFromResult(result);
    return {
      success: false,
      response: new Response(JSON.stringify(errorResponse), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return {
    success: true,
    user: adminResult.user,
    isAdmin: true,
  };
}
