import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getUserConsentStatus } from "@/lib/utils/consent/consentUtil";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import type { LoginFormData } from "@/lib/utils/validation/auth-validation";
import { loginFormSchema } from "@/lib/utils/validation/auth-validation";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  email: string;
  login_attempts: number;
  last_failed_login: Date | null;
  last_login_attempt: Date | null;
}

interface LoginAttempts {
  isBlocked: boolean;
  remainingAttempts: number;
  timeLeft: number;
  maxAttempts: number;
  lockoutDurationMs: number;
  profileId?: string; // 프로필이 있으면 id, 없으면 undefined
}

/**
 * 로그인 시도 횟수 확인
 */
async function checkLoginAttempts(
  email: string,
  request: NextRequest
): Promise<LoginAttempts> {
  try {
    const settings = await getSystemSettings();
    const maxAttempts = settings.maxLoginAttempts;
    const lockoutDurationMs =
      settings.accountLockoutDurationMinutes * 60 * 1000;

    // 사용자 프로필 조회
    let profile;
    try {
      profile = await prisma.$queryRaw<Profile[]>`
        SELECT id, email, login_attempts, last_failed_login, last_login_attempt
        FROM profiles
        WHERE email = ${email}
        LIMIT 1
      `;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "user",
        },
        queryError
      );
    }

    if (!profile.length) {
      return {
        isBlocked: false,
        remainingAttempts: maxAttempts,
        timeLeft: 0,
        maxAttempts,
        lockoutDurationMs,
        profileId: undefined,
      };
    }

    const user = profile[0];

    // 마지막 실패로부터 설정된 시간이 지났다면 시도 횟수 초기화
    if (
      user.last_failed_login &&
      new Date().getTime() - new Date(user.last_failed_login).getTime() >
        lockoutDurationMs
    ) {
      // 계정 잠금 해제 로그 기록 (이전에 잠겨있었던 경우만)
      if (user.login_attempts >= maxAttempts) {
        await createSystemLog(
          "ACCOUNT_UNLOCKED",
          LOG_MESSAGES.ACCOUNT_UNLOCKED(
            email,
            settings.accountLockoutDurationMinutes
          ),
          "info",
          { id: user.id, email: email },
          "auth",
          undefined,
          {
            action_type: "auth_event",
            event: "account_unlocked",
            email: email,
            lockout_duration: settings.accountLockoutDurationMinutes,
          },
          request
        );
      }

      // 시도 횟수 초기화
      try {
        await prisma.$executeRaw`
          UPDATE profiles
          SET login_attempts = 0,
              last_failed_login = NULL,
              last_login_attempt = NULL
          WHERE email = ${email}
        `;
      } catch (updateError) {
        throwBusinessError(
          "GENERAL_UPDATE_FAILED",
          {
            resourceType: "user",
          },
          updateError
        );
      }

      return {
        isBlocked: false,
        remainingAttempts: maxAttempts,
        timeLeft: 0,
        maxAttempts,
        lockoutDurationMs,
        profileId: user.id,
      };
    }

    // 로그인 시도 횟수가 최대 횟수를 초과했는지 확인
    const isBlocked = user.login_attempts >= maxAttempts;
    const remainingAttempts = Math.max(0, maxAttempts - user.login_attempts);

    if (isBlocked) {
      const lastFailedLogin = user.last_failed_login ?? new Date();
      const timeLeft = Math.max(
        0,
        lockoutDurationMs - (new Date().getTime() - lastFailedLogin.getTime())
      );

      return {
        isBlocked: true,
        remainingAttempts: 0,
        timeLeft,
        maxAttempts,
        lockoutDurationMs,
        profileId: user.id,
      };
    }

    return {
      isBlocked: false,
      remainingAttempts,
      timeLeft: 0,
      maxAttempts,
      lockoutDurationMs,
      profileId: user.id,
    };
  } catch (error: any) {
    throwBusinessError(
      "GENERAL_QUERY_FAILED",
      {
        resourceType: "user",
      },
      error
    );
  }
}

/**
 * 로그인 실패 시 시도 횟수 증가
 * profileId가 없으면 아무 작업도 하지 않음
 */
async function incrementLoginAttempts(
  email: string,
  request: NextRequest,
  profileId?: string
): Promise<void> {
  if (!profileId) return; // 존재하지 않는 계정이면 아무 작업도 하지 않음
  const settings = await getSystemSettings();
  const suspiciousThreshold = Math.floor(settings.maxLoginAttempts / 2);

  // 프로필 업데이트
  try {
    const profile = await prisma.profiles.update({
      where: { email },
      data: {
        login_attempts: {
          increment: 1,
        },
        last_failed_login: new Date(),
      },
    });

    // 로그인 실패 로그 생성 (error 레벨로 변경)
    await createSystemLog(
      "LOGIN_FAILED",
      LOG_MESSAGES.LOGIN_FAILED(email, profile.login_attempts || 0),
      "error",
      { id: profile.id, email: email },
      "auth",
      undefined,
      {
        action_type: "auth_event",
        event: "login_failed",
        email: email,
        login_attempts: profile.login_attempts || 0,
      },
      request
    );

    // 의심스러운 로그인 시도 감지
    if ((profile.login_attempts || 0) >= suspiciousThreshold) {
      await createSystemLog(
        "SUSPICIOUS_LOGIN_ATTEMPTS",
        LOG_MESSAGES.SUSPICIOUS_LOGIN_ATTEMPTS(
          email,
          profile.login_attempts || 0,
          suspiciousThreshold
        ),
        "warn",
        { id: profile.id, email: email },
        "auth",
        undefined,
        {
          action_type: "auth_event",
          event: "suspicious_login_attempts",
          email: email,
          login_attempts: profile.login_attempts || 0,
          suspicious_threshold: suspiciousThreshold,
        },
        request
      );
    }

    // 계정 잠금 시 로그 기록
    if ((profile.login_attempts || 0) >= settings.maxLoginAttempts) {
      await createSystemLog(
        "ACCOUNT_LOCKED",
        LOG_MESSAGES.ACCOUNT_LOCKED(
          email,
          profile.login_attempts || 0,
          settings.maxLoginAttempts
        ),
        "warn",
        { id: profile.id, email: email },
        "auth",
        undefined,
        {
          action_type: "auth_event",
          event: "account_locked",
          email: email,
          login_attempts: profile.login_attempts || 0,
          max_attempts: settings.maxLoginAttempts,
        },
        request
      );
    }
  } catch (error: any) {
    throwBusinessError(
      "GENERAL_UPDATE_FAILED",
      {
        resourceType: "loginAttempts",
      },
      error
    );
  }
}

export async function POST(request: NextRequest) {
  let email: string | undefined;

  try {
    const body: LoginFormData = await request.json();

    // ZOD 스키마로 검증
    const validation = loginFormSchema.safeParse(body);
    if (!validation.success) {
      throwBusinessError("INVALID_FORM_DATA", {
        errors: validation.error.errors,
        formType: "user",
      });
    }

    const { email: validatedEmail, password } = validation.data;
    email = validatedEmail;

    // 1. 로그인 시도 횟수 확인과 Supabase 인증을 병렬로 처리
    const supabase = await createClient();

    const [authResult, attempts] = await Promise.all([
      supabase.auth.signInWithPassword({ email, password }),
      checkLoginAttempts(email, request),
    ]);

    // 계정이 잠겨있는 경우 (인증 성공 여부와 관계없이 체크)
    if (attempts.isBlocked) {
      throwBusinessError("ACCOUNT_LOCKED", {
        timeLeft: attempts.timeLeft,
        remainingAttempts: 0,
      });
    }

    const {
      data: { user, session },
      error,
    } = authResult;

    // 3. 로그인 결과에 따른 처리
    if (error) {
      if (!attempts.profileId) {
        // 존재하지 않는 계정이면 일반적인 실패 메시지 반환 (update, 시도횟수 증가 X)
        const result = getErrorResultFromRawError(error, {
          operation: "login",
          email: email,
        });

        return NextResponse.json(makeErrorResponseFromResult(result), {
          status: result.status,
        });
      }
      // 로그인 실패: 시도 횟수 증가
      await incrementLoginAttempts(email, request, attempts.profileId);

      const result = getErrorResultFromRawError(error, {
        operation: "login",
        email: email,
      });

      return NextResponse.json(makeErrorResponseFromResult(result), {
        status: result.status,
      });
    }

    // 로그인 성공: 단일 쿼리로 시도 횟수 초기화와 로그인 시간 업데이트 통합
    try {
      await prisma.profiles.update({
        where: { email },
        data: {
          login_attempts: 0,
          last_failed_login: null,
          last_login_attempt: null,
          last_login_at: new Date(),
          login_count: {
            increment: 1, // 로그인 카운트 증가
          },
        },
      });
    } catch (error: any) {
      throwBusinessError(
        "GENERAL_UPDATE_FAILED",
        {
          resourceType: "loginSuccess",
        },
        error
      );
    }

    // 약관 동의 상태 조회
    const consentData = await getUserConsentStatus(user!.id);

    // 로그인 성공 로그 기록 (백그라운드에서 처리)
    setTimeout(async () => {
      try {
        await createSystemLog(
          "LOGIN_SUCCESS",
          LOG_MESSAGES.LOGIN_SUCCESS(email!),
          "info",
          { id: user!.id, email: email! },
          "auth",
          undefined,
          {
            action_type: "auth_event",
            event: "login_success",
            email: email!,
          },
          request
        );
      } catch (logError) {
        devLog.warn("Login success log failed:", logError);
      }
    }, 0);

    // Supabase 기본 쿠키 사용 (중복 쿠키 설정 제거)
    const response = NextResponse.json({
      success: true,
      message: consentData.hasAllRequiredConsents
        ? "로그인에 성공했습니다. 대시보드로 이동합니다."
        : "로그인에 성공했습니다. 프로필 설정 페이지로 이동합니다.",
      user: {
        id: user?.id,
        email: user?.email,
        created_at: user?.created_at,
      },
      session: {
        access_token: session!.access_token,
        refresh_token: session!.refresh_token,
        expires_at: session!.expires_at,
      },
      remainingAttempts: attempts.maxAttempts,
      consent: consentData, // 약관 동의 상태 추가
    });

    return response;
  } catch (err) {
    const error = err as Error;

    // 시스템 에러 로깅
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "LOGIN_SYSTEM_ERROR",
      LOG_MESSAGES.LOGIN_SYSTEM_ERROR(errorMessage),
      "error",
      undefined,
      "system",
      undefined,
      {
        action_type: "auth_event",
        event: "login_system_error",
        error_message: errorMessage,
        email: email || "unknown",
      },
      request
    );
    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "login",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
