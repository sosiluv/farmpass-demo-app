import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog, logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { sendSupabaseBroadcast } from "@/lib/supabase/broadcast";

// Turnstile 검증 함수
async function verifyTurnstile(
  token: string,
  clientIP: string,
  userAgent: string
) {
  if (!token) {
    throw new Error("캡차 토큰이 필요합니다.");
  }

  const verificationResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || "",
        response: token,
        remoteip: clientIP,
      }),
    }
  );

  const verificationResult = await verificationResponse.json();

  if (!verificationResult.success) {
    const errorCodes = verificationResult["error-codes"] || [];
    const firstErrorCode = errorCodes[0] || "unknown-error";
    await logApiError(
      "/api/auth/register",
      "POST",
      `Turnstile verification failed: ${errorCodes.join(", ")}`,
      undefined,
      { ip: clientIP, userAgent }
    );
    return NextResponse.json(
      {
        success: false,
        error: "TURNSTILE_VERIFICATION_FAILED",
        message: firstErrorCode,
        details: errorCodes,
      },
      { status: 400 }
    );
  }

  return true;
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const body = await request.json();

    // 클라이언트에서 이미 검증된 데이터를 그대로 사용
    const { email, password, name, phone, turnstileToken } = body;

    const validatedData = { email, password, name, phone, turnstileToken };

    // 캡차 인증 확인 (내부 함수 사용)
    await verifyTurnstile(validatedData.turnstileToken, clientIP, userAgent);

    // Supabase Auth를 통한 사용자 생성
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          phone: validatedData.phone,
        },
      },
    });

    if (authError) {
      devLog.error("Supabase auth error:", authError);

      // 회원가입 실패 로그 기록
      await createSystemLog(
        "USER_CREATION_FAILED",
        `회원가입 실패: ${validatedData.email} - ${authError.message}`,
        "error",
        undefined,
        "user",
        undefined,
        {
          email: validatedData.email,
          name: validatedData.name,
          error_message: authError.message,
          error_code: authError.status || "UNKNOWN",
        },
        validatedData.email,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        {
          success: false,
          error: authError.status || "AUTH_ERROR",
          message: authError.message,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "USER_CREATION_FAILED",
          message: "회원가입에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 🔥 회원가입 성공 실시간 브로드캐스트
    await sendSupabaseBroadcast({
      channel: "profile_updates",
      event: "profile_created",
      payload: {
        eventType: "INSERT",
        new: {
          id: authData.user.id,
          email: validatedData.email,
          name: validatedData.name,
          phone: validatedData.phone,
          created_at: new Date().toISOString(),
          account_type: "user",
        },
        old: null,
        table: "profiles",
        schema: "public",
      },
    });

    // 회원가입 성공 로그 기록
    await createSystemLog(
      "USER_CREATED",
      `새로운 사용자 회원가입 완료: ${validatedData.name} (${validatedData.email})`,
      "info",
      authData.user.id,
      "user",
      authData.user.id,
      {
        user_id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
        account_type: "user",
        registration_source: "web",
      },
      validatedData.email,
      clientIP,
      userAgent
    );

    // 서버 사이드에서는 자동 로그인이 되지 않으므로 signOut 불필요
    // await supabase.auth.signOut();

    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
        user: {
          id: authData.user.id,
          email: validatedData.email,
          name: validatedData.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    devLog.error("Registration error:", error);

    // 회원가입 오류 로그 기록
    await createSystemLog(
      "USER_CREATION_FAILED",
      `회원가입 처리 중 오류 발생: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "error",
      undefined,
      "user",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        error_type: "SYSTEM_ERROR",
      },
      undefined,
      clientIP,
      userAgent
    );

    // 캡차 검증 실패 오류 처리
    if (error instanceof Error && error.message.includes("캡차")) {
      return NextResponse.json(
        {
          success: false,
          error: "TURNSTILE_VERIFICATION_FAILED",
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message:
          "회원가입 처리 중 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
