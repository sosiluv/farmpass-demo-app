import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { getUserConsentStatus } from "@/lib/utils/consent/consentUtil";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    try {
      // OAuth 코드를 세션으로 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        devLog.error("OAuth 콜백 처리 실패:", error);

        // Supabase Auth 에러를 표준화된 에러 코드로 매핑
        const errorCode = mapRawErrorToCode(error, "auth");
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?message=${encodeURIComponent(
            getErrorMessage(errorCode)
          )}`
        );
      }

      // 세션 설정 완료 확인을 위한 추가 검증
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        devLog.error("세션 확인 실패:", sessionError);

        // 세션 에러를 표준화된 에러 코드로 매핑
        const errorCode = mapRawErrorToCode(sessionError, "auth");
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?message=${encodeURIComponent(
            getErrorMessage(errorCode)
          )}`
        );
      }
      // 프로필 로그인 시간/카운트 업데이트 및 로그인 성공 로그 기록
      try {
        const authedUser = session.user;
        const userEmail = authedUser?.email || undefined;
        if (userEmail) {
          // last_login_at, login_count 업데이트
          await prisma.profiles.update({
            where: { email: userEmail },
            data: {
              last_login_at: new Date(),
              login_count: { increment: 1 },
            },
          });
        }

        // 시스템 로그 기록 (provider 포함)
        const provider = searchParams.get("provider");
        await createSystemLog(
          "LOGIN_SUCCESS",
          LOG_MESSAGES.LOGIN_SUCCESS(userEmail || "unknown"),
          "info",
          { id: authedUser.id, email: userEmail || "unknown" },
          "auth",
          authedUser.id,
          {
            action_type: "auth_event",
            event: "login_success",
            email: userEmail,
            provider,
          }
        );
      } catch (logErr) {
        devLog.warn("[OAuth] 로그인 후 로그/프로필 업데이트 실패:", logErr);
      }

      // 약관 동의 상태 확인
      let redirectUrl: string;
      try {
        const consentData = await getUserConsentStatus(session.user.id);

        if (consentData.hasAllRequiredConsents) {
          // 모든 약관 동의가 완료된 경우 대시보드로 이동
          redirectUrl = `${origin}/admin/dashboard`;
        } else {
          // 약관 동의가 필요한 경우 프로필 설정 페이지로 이동
          redirectUrl = `${origin}/profile-setup`;
        }
      } catch (consentError) {
        devLog.warn("[OAuth] 약관 동의 상태 확인 실패:", consentError);
        // 에러 발생 시 기본적으로 프로필 설정 페이지로 이동
        redirectUrl = `${origin}/profile-setup`;
      }

      // 환경별 리다이렉트 URL 조정
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (!isLocalEnv && forwardedHost) {
        redirectUrl = redirectUrl.replace(origin, `https://${forwardedHost}`);
      }

      // 세션 설정 완료를 위한 짧은 지연 (선택사항)
      await new Promise((resolve) => setTimeout(resolve, 100));

      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      devLog.error("OAuth 콜백 처리 중 예외 발생:", error);

      // 시스템 에러를 표준화된 에러 코드로 매핑
      const errorCode = mapRawErrorToCode(error);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?message=${encodeURIComponent(
          getErrorMessage(errorCode)
        )}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?message=${encodeURIComponent(
      "OAuth 인증 코드가 없습니다. 소셜 로그인을 다시 시도해주세요."
    )}`
  );
}
