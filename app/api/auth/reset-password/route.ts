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
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_EMAIL",
          message: "이메일 주소가 필요합니다.",
        },
        { status: 400 }
      );
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
        {
          success: false,
          error: "USER_PROFILE_ERROR",
          message: "사용자 정보 확인 중 오류가 발생했습니다.",
        },
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
          message: "사용자를 찾을 수 없습니다.",
          status: 404,
        },
        "Email rate limit exceeded": {
          message:
            "이메일 전송 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.",
          status: 429,
        },
        "Too many requests": {
          message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          status: 429,
        },
        "Invalid email": {
          message: "유효하지 않은 이메일 주소입니다.",
          status: 400,
        },
        "Email not confirmed": {
          message: "이메일이 확인되지 않았습니다.",
          status: 400,
        },
        "Error sending recovery email": {
          message:
            "복구 이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
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
            message: "비밀번호 재설정 이메일 전송에 실패했습니다.",
            status: 500,
          };

      return NextResponse.json(
        {
          success: false,
          error: "PASSWORD_RESET_ERROR",
          message: errorResponse.message,
        },
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
      { message: "비밀번호 재설정 이메일이 전송되었습니다." },
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
      {
        success: false,
        error: "PASSWORD_RESET_SYSTEM_ERROR",
        message: "비밀번호 재설정 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
