import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import { createAuthLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
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

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "이메일 주소가 필요합니다." },
        { status: 400 }
      );
    }

    // 시스템 설정에서 최대 로그인 시도 횟수 및 잠금 시간 가져오기
    const settings = await getSystemSettings();
    const maxAttempts = settings.maxLoginAttempts;
    const lockoutDurationMs =
      settings.accountLockoutDurationMinutes * 60 * 1000;

    // 사용자 프로필 조회
    const profile = await prisma.$queryRaw<Profile[]>`
      SELECT id, email, login_attempts, last_failed_login, last_login_attempt
      FROM profiles
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!profile.length) {
      return NextResponse.json({ allowed: true }); // 프로필이 없는 경우 허용
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
        await createAuthLog(
          "ACCOUNT_UNLOCKED",
          `계정 잠금 해제: ${email} (${settings.accountLockoutDurationMinutes}분 타임아웃 후 자동 해제)`,
          email,
          user.id,
          {
            previous_attempts: user.login_attempts,
            max_attempts: maxAttempts,
            locked_duration_minutes: settings.accountLockoutDurationMinutes,
            action_type: "security_event",
            unlocked_at: new Date().toISOString(),
          },
          {
            ip: clientIP,
            userAgent,
          }
        ).catch((logError) =>
          devLog.error("Failed to log account unlock:", logError)
        );
      }

      await prisma.$executeRaw`
        UPDATE profiles
        SET login_attempts = 0,
            last_failed_login = NULL,
            last_login_attempt = NULL
        WHERE email = ${email}
      `;
      return NextResponse.json({ allowed: true });
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

      // 계정 잠금 로그 기록 (보안 이벤트)
      await createAuthLog(
        "ACCOUNT_LOCKED",
        `계정 잠금: ${email} (로그인 시도 횟수 초과: ${user.login_attempts}/${maxAttempts})`,
        email,
        user.id,
        {
          login_attempts: user.login_attempts,
          max_attempts: maxAttempts,
          last_failed_login: user.last_failed_login,
          time_left_minutes: Math.ceil(timeLeft / (60 * 1000)),
          action_type: "security_event",
          blocked_at: new Date().toISOString(),
        },
        {
          ip: clientIP,
          userAgent,
        }
      ).catch((logError) =>
        devLog.error("Failed to log account lock:", logError)
      );

      return NextResponse.json(
        {
          allowed: false,
          message: `너무 많은 로그인 시도가 있었습니다. ${Math.ceil(
            timeLeft / (60 * 1000)
          )}분 후에 다시 시도해주세요.`,
          timeLeft,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      allowed: true,
      remainingAttempts,
    });
  } catch (error) {
    devLog.error("Login attempts validation error:", error);
    return NextResponse.json(
      { error: "로그인 시도 검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
