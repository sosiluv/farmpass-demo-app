import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getClientIP } from "@/lib/server/ip-helpers";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { prisma } from "@/lib/prisma";

// Turnstile 검증 함수
async function verifyTurnstile(token: string, request: NextRequest) {
  const clientIP = getClientIP(request);

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
    await createSystemLog(
      "TURNSTILE_VERIFICATION_FAILED",
      LOG_MESSAGES.TURNSTILE_VERIFICATION_FAILED(errorCodes.join(", ")),
      "error",
      undefined,
      "system",
      undefined,
      {
        action_type: "auth_event",
        event: "turnstile_verification_failed",
        error_codes: errorCodes,
      }
    );
    throwBusinessError("TURNSTILE_VERIFICATION_FAILED", {
      operation: "register",
    });
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 클라이언트에서 이미 검증된 데이터를 그대로 사용
    const {
      email,
      password,
      name,
      phone,
      turnstileToken,
      privacyConsent,
      termsConsent,
      marketingConsent,
    } = body;

    const validatedData = {
      email,
      password,
      name,
      phone,
      turnstileToken,
      privacyConsent,
      termsConsent,
      marketingConsent,
    };

    // 캡차 인증 확인 (내부 함수 사용)
    await verifyTurnstile(validatedData.turnstileToken, request);

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

      // 회원가입 실패 로그 기록 - 템플릿 활용
      await createSystemLog(
        "USER_CREATE_FAILED",
        LOG_MESSAGES.USER_CREATE_FAILED(validatedData.email, authError.message),
        "error",
        undefined,
        "user",
        undefined,
        {
          action_type: "auth_event",
          event: "user_create_failed",
          error_message: authError.message,
          email: validatedData.email,
        },
        request
      );

      const result = getErrorResultFromRawError(authError, {
        operation: "register",
        email: validatedData.email,
      });

      return NextResponse.json(makeErrorResponseFromResult(result), {
        status: result.status,
      });
    }

    if (!authData.user) {
      throwBusinessError("GENERAL_CREATE_FAILED", {
        resourceType: "user",
      });
    }

    // 활성화된 약관 조회
    const activeTerms = await prisma.terms_management.findMany({
      where: {
        is_active: true,
        type: {
          in: ["privacy", "terms", "marketing"],
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    // 약관 타입별 ID 매핑
    const termIdMap = new Map(activeTerms.map((term) => [term.type, term.id]));

    // 약관 동의 정보를 user_consents 테이블에 저장
    const consentRecords = [];
    const now = new Date();

    // 필수 약관 동의 저장
    if (validatedData.privacyConsent) {
      const privacyTermId = termIdMap.get("privacy");
      if (privacyTermId) {
        consentRecords.push({
          user_id: authData.user.id,
          term_id: privacyTermId,
          agreed: true,
          agreed_at: now,
        });
      }
    }

    if (validatedData.termsConsent) {
      const termsTermId = termIdMap.get("terms");
      if (termsTermId) {
        consentRecords.push({
          user_id: authData.user.id,
          term_id: termsTermId,
          agreed: true,
          agreed_at: now,
        });
      }
    }

    // 선택적 마케팅 동의 저장
    if (validatedData.marketingConsent) {
      const marketingTermId = termIdMap.get("marketing");
      if (marketingTermId) {
        consentRecords.push({
          user_id: authData.user.id,
          term_id: marketingTermId,
          agreed: true,
          agreed_at: now,
        });
      }
    }

    // 약관 동의 정보 저장
    if (consentRecords.length > 0) {
      try {
        await prisma.user_consents.createMany({
          data: consentRecords,
        });
      } catch (consentError) {
        throwBusinessError(
          "GENERAL_CREATE_FAILED",
          {
            resourceType: "consent",
          },
          consentError
        );
      }
    }

    // 회원가입 성공 로그 기록 - 템플릿 활용
    await createSystemLog(
      "USER_CREATED",
      LOG_MESSAGES.USER_CREATED(validatedData.name, validatedData.email),
      "info",
      { id: authData.user.id, email: validatedData.email },
      "user",
      authData.user.id,
      {
        event: "user_created",
        user_id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
        privacy_consent: validatedData.privacyConsent,
        terms_consent: validatedData.termsConsent,
        marketing_consent: validatedData.marketingConsent,
      },
      request
    );

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

    const errorMessage = error instanceof Error ? error.message : String(error);
    // 회원가입 오류 로그 기록 - 템플릿 활용
    await createSystemLog(
      "USER_CREATE_SYSTEM_ERROR",
      LOG_MESSAGES.USER_CREATE_SYSTEM_ERROR(errorMessage),
      "error",
      undefined,
      "user",
      undefined,
      {
        action_type: "auth_event",
        event: "user_create_system_error",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "register",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
