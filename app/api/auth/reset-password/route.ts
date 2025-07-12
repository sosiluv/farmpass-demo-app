import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });
    }

    // 서버용 Supabase 클라이언트 생성
    const supabase = await createClient();

    // profiles 테이블에서 사용자 정보 가져오기
    const { data: userData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "USER_PROFILE_ERROR" },
        { status: 500 }
      );
    }

    // Supabase Auth를 통한 비밀번호 재설정 이메일 전송
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
    });

    if (error) {
      // 실패 로그 기록 (error 레벨로 변경)
      await createSystemLog(
        "PASSWORD_RESET_REQUEST_FAILED",
        `비밀번호 재설정 요청 실패: ${email} - ${error.message}`,
        "error",
        userData?.id,
        "auth",
        undefined,
        {
          error_type: error.code || "unknown_error",
          error_message: error.message,
          request_ip: clientIP,
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
        },
        email,
        clientIP,
        userAgent
      ).catch((logError) =>
        devLog.error("Failed to log password reset failure:", logError)
      );

      // 에러 메시지 매핑
      const errorMessages = {
        "User not found": {
          message: "User not found",
          status: 404,
        },
        "Email rate limit exceeded": {
          message: "Email rate limit exceeded. Please try again later.",
          status: 429,
        },
        "Too many requests": {
          message: "Too many requests. Please try again later.",
          status: 429,
        },
        "Invalid email": {
          message: "Invalid email address",
          status: 400,
        },
        "Email not confirmed": {
          message: "Email not confirmed",
          status: 400,
        },
        "Error sending recovery email": {
          message: "Error sending recovery email. Please try again later.",
          status: 500,
        },
      };

      const errorKey = Object.keys(errorMessages).find(
        (key) =>
          error.message.includes(key) || error.code?.includes(key.toLowerCase())
      );

      const errorResponse = errorKey
        ? errorMessages[errorKey as keyof typeof errorMessages]
        : {
            message: "Password reset email sending failed",
            status: 500,
          };

      return NextResponse.json(
        { error: errorResponse.message },
        { status: errorResponse.status }
      );
    }

    // 세션 클리어
    await supabase.auth.signOut();

    // 성공 로그 기록
    await createSystemLog(
      "PASSWORD_RESET_REQUESTED",
      `비밀번호 재설정 요청: ${email}`,
      "info",
      userData?.id,
      "auth",
      undefined,
      {
        request_ip: clientIP,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
        action_type: "security_event",
      },
      email,
      clientIP,
      userAgent
    ).catch((logError) =>
      devLog.error("Failed to log password reset request:", logError)
    );

    return NextResponse.json(
      { message: "Password reset email has been sent." },
      { status: 200 }
    );
  } catch (error) {
    // 시스템 에러 로그 기록 (error 레벨로 변경)
    await createSystemLog(
      "PASSWORD_RESET_SYSTEM_ERROR",
      `비밀번호 재설정 시스템 오류: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "error",
      undefined,
      "auth",
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      undefined,
      clientIP,
      userAgent
    ).catch((logError) =>
      devLog.error("Failed to log password reset system error:", logError)
    );

    return NextResponse.json(
      { error: "PASSWORD_RESET_SYSTEM_ERROR" },
      { status: 500 }
    );
  }
}
