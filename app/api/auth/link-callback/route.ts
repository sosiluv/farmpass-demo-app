import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/utils/logging/dev-logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/account?tab=profile";

  if (code) {
    const supabase = await createClient();

    try {
      // OAuth 코드를 세션으로 교환
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        devLog.error("소셜 계정 연동 콜백 처리 실패:", error);
        return NextResponse.redirect(
          `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
            error.message
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
        return NextResponse.redirect(
          `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
            "세션 확인에 실패했습니다."
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

      // 성공 메시지 추가
      redirectUrl += "&success=linked";

      // 세션 설정 완료를 위한 짧은 지연
      await new Promise((resolve) => setTimeout(resolve, 100));

      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      devLog.error("소셜 계정 연동 콜백 처리 중 예외 발생:", error);
      return NextResponse.redirect(
        `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
          "계정 연동 중 오류가 발생했습니다."
        )}`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/admin/account?tab=profile&error=link_failed&message=${encodeURIComponent(
      "유효하지 않은 연동 요청입니다."
    )}`
  );
}
