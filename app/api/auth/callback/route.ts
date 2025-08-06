import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  mapRawErrorToCode,
  getErrorMessage,
} from "@/lib/utils/error/errorUtil";

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
      // 리다이렉트 URL 결정
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}/profile-setup`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}/profile-setup`;
      } else {
        redirectUrl = `${origin}/profile-setup`;
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
