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
  const error = searchParams.get("error");
  const error_code = searchParams.get("error_code");
  const next = searchParams.get("next") ?? "/admin/account?tab=profile";
  const errorObj = { code: error_code };

  // OAuth 에러가 있는 경우 먼저 처리
  if (error) {
    const errorCode = mapRawErrorToCode(errorObj, "auth");
    return NextResponse.redirect(
      `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
        getErrorMessage(errorCode)
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      // OAuth 코드를 세션으로 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        devLog.error("소셜 계정 연동 콜백 처리 실패:", error);

        // Supabase Auth 에러를 표준화된 에러 코드로 매핑
        const errorCode = mapRawErrorToCode(errorObj, "auth");
        return NextResponse.redirect(
          `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
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
          `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
            getErrorMessage(errorCode)
          )}`
        );
      }

      // 리다이렉트 URL 결정
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }

      // 성공 메시지 추가 (provider 정보 포함)
      const provider = searchParams.get("provider");
      redirectUrl += "&success=linked";
      if (provider) {
        redirectUrl += `&provider=${provider}`;
      }

      // 세션 설정 완료를 위한 짧은 지연
      await new Promise((resolve) => setTimeout(resolve, 100));

      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      devLog.error("소셜 계정 연동 콜백 처리 중 예외 발생:", error);

      // 시스템 에러를 표준화된 에러 코드로 매핑
      const errorCode = mapRawErrorToCode(error);
      return NextResponse.redirect(
        `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
          getErrorMessage(errorCode)
        )}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
      "OAuth 인증 코드가 없습니다. 소셜 로그인을 다시 시도해주세요."
    )}`
  );
}
