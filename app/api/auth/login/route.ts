import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import {
  createSystemLog,
  logSecurityError,
  logApiError,
} from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
  logDatabasePerformance,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

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
}

/**
 * 로그인 시도 횟수 확인
 */
async function checkLoginAttempts(email: string): Promise<LoginAttempts> {
  const settings = await getSystemSettings();
  const maxAttempts = settings.maxLoginAttempts;
  const lockoutDurationMs = settings.accountLockoutDurationMinutes * 60 * 1000;

  // 사용자 프로필 조회
  const profile = await prisma.$queryRaw<Profile[]>`
    SELECT id, email, login_attempts, last_failed_login, last_login_attempt
    FROM profiles
    WHERE email = ${email}
    LIMIT 1
  `;

  if (!profile.length) {
    return {
      isBlocked: false,
      remainingAttempts: maxAttempts,
      timeLeft: 0,
      maxAttempts,
      lockoutDurationMs,
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
        `계정 잠금 해제: ${email} (${settings.accountLockoutDurationMinutes}분 타임아웃 후 자동 해제)`,
        "info",
        user.id,
        "auth",
        undefined,
        {
          previous_attempts: user.login_attempts,
          max_attempts: maxAttempts,
          locked_duration_minutes: settings.accountLockoutDurationMinutes,
          action_type: "security_event",
          unlocked_at: new Date().toISOString(),
          unlock_type: "automatic_timeout",
        },
        email,
        "system-auto", // 자동 해제이므로 system-auto로 표시
        "System Auto Unlock"
      ).catch((logError) =>
        devLog.error("Failed to log account unlock:", logError)
      );
    }

    // 시도 횟수 초기화
    await prisma.$executeRaw`
      UPDATE profiles
      SET login_attempts = 0,
          last_failed_login = NULL,
          last_login_attempt = NULL
      WHERE email = ${email}
    `;

    return {
      isBlocked: false,
      remainingAttempts: maxAttempts,
      timeLeft: 0,
      maxAttempts,
      lockoutDurationMs,
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
    };
  }

  return {
    isBlocked: false,
    remainingAttempts,
    timeLeft: 0,
    maxAttempts,
    lockoutDurationMs,
  };
}

/**
 * 로그인 실패 시 시도 횟수 증가
 */
async function incrementLoginAttempts(
  email: string,
  clientIP: string,
  userAgent: string
): Promise<void> {
  const settings = await getSystemSettings();
  const suspiciousThreshold = Math.floor(settings.maxLoginAttempts / 2);

  // 프로필 업데이트
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
    `로그인 실패: ${email}, 로그인 시도 횟수: ${profile.login_attempts || 0}`,
    "error",
    profile.id,
    "auth",
    undefined,
    {
      attempts: profile.login_attempts || 0,
      ip: clientIP,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    },
    email,
    clientIP,
    userAgent
  );

  // 의심스러운 로그인 시도 감지
  if ((profile.login_attempts || 0) >= suspiciousThreshold) {
    await logSecurityError(
      "SUSPICIOUS_LOGIN_ATTEMPTS",
      `의심스러운 로그인 시도 감지: ${email} (${profile.login_attempts}회 시도)`,
      profile.id,
      clientIP,
      userAgent
    );
  }

  // 계정 잠금 시 로그 기록
  if ((profile.login_attempts || 0) >= settings.maxLoginAttempts) {
    await createSystemLog(
      "ACCOUNT_LOCKED",
      `계정 잠금: ${email} (로그인 시도 횟수 초과: ${profile.login_attempts}/${settings.maxLoginAttempts})`,
      "warn",
      profile.id,
      "auth",
      undefined,
      {
        login_attempts: profile.login_attempts,
        max_attempts: settings.maxLoginAttempts,
        last_failed_login: profile.last_failed_login,
        time_left_minutes: Math.ceil(settings.accountLockoutDurationMinutes),
        action_type: "security_event",
        blocked_at: new Date().toISOString(),
      },
      email,
      clientIP,
      userAgent
    );
  }
}

export async function POST(request: NextRequest) {
  const monitor = new PerformanceMonitor("auth_login_integrated");

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/auth/login",
        method: "POST",
        duration_ms: duration,
        status_code: 400,
        response_size: 0,
      });

      return NextResponse.json(
        {
          success: false,
          error: "MISSING_CREDENTIALS",
        },
        { status: 400 }
      );
    }

    // 1. 로그인 시도 횟수 확인과 Supabase 인증을 병렬로 처리
    const supabase = await createClient();

    const [authResult, attempts] = await Promise.all([
      supabase.auth.signInWithPassword({ email, password }),
      checkLoginAttempts(email),
    ]);

    // 계정이 잠겨있는 경우 (인증 성공 여부와 관계없이 체크)
    if (attempts.isBlocked) {
      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/auth/login",
        method: "POST",
        duration_ms: duration,
        status_code: 429,
        response_size: 0,
      });

      return NextResponse.json(
        {
          success: false,
          error: "ACCOUNT_LOCKED",
          message: `Too many login attempts. Please try again in ${Math.ceil(
            attempts.timeLeft / (60 * 1000)
          )} minutes.`,
          timeLeft: attempts.timeLeft,
          remainingAttempts: 0,
        },
        { status: 429 }
      );
    }

    const {
      data: { user, session },
      error,
    } = authResult;

    // 3. 로그인 결과에 따른 처리
    if (error) {
      // 로그인 실패: 시도 횟수 증가
      const incrementMonitor = new PerformanceMonitor(
        "auth_increment_attempts"
      );
      await incrementLoginAttempts(email, clientIP, userAgent);
      const incrementDuration = await incrementMonitor.finish();

      await logDatabasePerformance(
        {
          query: "UPDATE profiles login_attempts increment",
          table: "profiles",
          duration_ms: incrementDuration,
          row_count: 1,
        },
        undefined,
        {
          ip: clientIP,
          email: email,
          userAgent: userAgent,
        }
      );

      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/auth/login",
        method: "POST",
        duration_ms: duration,
        status_code: 401,
        response_size: 0,
      });

      return NextResponse.json(
        {
          success: false,
          error: "LOGIN_FAILED",
          message: "INVALID_CREDENTIALS",
          remainingAttempts: attempts.remainingAttempts - 1,
          accountLocked: attempts.remainingAttempts - 1 <= 0,
        },
        { status: 401 }
      );
    }

    // 로그인 성공: 단일 쿼리로 시도 횟수 초기화와 로그인 시간 업데이트 통합
    const resetMonitor = new PerformanceMonitor(
      "auth_reset_attempts_and_update_time"
    );

    // 단일 쿼리로 통합하여 성능 향상
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

    // 로그인 성공 로그 기록 (백그라운드에서 처리)
    setTimeout(async () => {
      try {
        await createSystemLog(
          "LOGIN_SUCCESS",
          `로그인 성공: ${email}`,
          "info",
          user!.id,
          "auth",
          undefined,
          {
            previous_attempts:
              attempts.maxAttempts - attempts.remainingAttempts,
            reset_reason: "successful_login",
            action_type: "security_event",
            reset_at: new Date().toISOString(),
          },
          email,
          clientIP,
          userAgent
        );
      } catch (logError) {
        devLog.warn("Login success log failed:", logError);
      }
    }, 0);

    const resetDuration = await resetMonitor.finish();

    const duration = await monitor.finish();

    // Supabase 기본 쿠키 사용 (중복 쿠키 설정 제거)
    const response = NextResponse.json({
      success: true,
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
    });

    // 성능 로깅을 비동기로 처리하여 응답 지연 방지
    setTimeout(async () => {
      try {
        await logDatabasePerformance(
          {
            query: "UPDATE profiles login_attempts reset + last_login_at",
            table: "profiles",
            duration_ms: resetDuration,
            row_count: 1,
          },
          user?.id,
          {
            ip: clientIP,
            email: email,
            userAgent: userAgent,
          }
        );

        await logApiPerformance({
          endpoint: "/api/auth/login",
          method: "POST",
          duration_ms: duration,
          status_code: 200,
          response_size: JSON.stringify(response).length,
        });
      } catch (logError) {
        devLog.warn("Performance logging failed:", logError);
      }
    }, 0);

    return response;
  } catch (err) {
    const duration = await monitor.finish();
    devLog.error("Integrated login error:", err);

    const error = err as Error;

    await logApiError("/api/auth/login", "POST", error, undefined, {
      ip: clientIP,
      userAgent: userAgent,
    });

    await logApiPerformance({
      endpoint: "/api/auth/login",
      method: "POST",
      duration_ms: duration,
      status_code: 500,
      response_size: 0,
    });

    return NextResponse.json(
      {
        success: false,
        error: "LOGIN_SYSTEM_ERROR",
      },
      { status: 500 }
    );
  }
}
