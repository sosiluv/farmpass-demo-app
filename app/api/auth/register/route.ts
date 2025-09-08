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
import { getSystemSettings } from "@/lib/cache/system-settings-cache";
import type { RegistrationFormData } from "@/lib/utils/validation/auth-validation";
import { createRegistrationFormSchema } from "@/lib/utils/validation/auth-validation";

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
      "turnstile_verification", // Turnstile 검증 작업을 resourceId로 사용
      {
        action_type: "auth_event",
        event: "turnstile_verification_failed",
        error_codes: errorCodes,
        client_ip: clientIP,
      },
      request
    );
    throwBusinessError("TURNSTILE_VERIFICATION_FAILED", {
      operation: "register",
    });
  }

  return true;
}

export async function POST(request: NextRequest) {
  let email: string | undefined;
  let user: any = null; // user 정보를 저장할 변수 추가

  try {
    const body: RegistrationFormData & {
      turnstileToken: string;
      privacyConsent: boolean;
      termsConsent: boolean;
      marketingConsent: boolean;
      ageConsent: boolean;
    } = await request.json();

    // 시스템 설정에서 비밀번호 규칙 가져오기
    const settings = await getSystemSettings();
    const passwordRules = {
      passwordMinLength: settings.passwordMinLength,
      passwordRequireSpecialChar: settings.passwordRequireSpecialChar,
      passwordRequireNumber: settings.passwordRequireNumber,
      passwordRequireUpperCase: settings.passwordRequireUpperCase,
      passwordRequireLowerCase: settings.passwordRequireLowerCase,
    };

    // ZOD 스키마로 검증 (RegistrationFormData 부분만)
    const registrationSchema = createRegistrationFormSchema(passwordRules);
    const {
      turnstileToken,
      privacyConsent,
      termsConsent,
      marketingConsent,
      ageConsent,
      ...registrationData
    } = body;

    const validation = registrationSchema.safeParse(registrationData);

    if (!validation.success) {
      throwBusinessError("INVALID_FORM_DATA", {
        errors: validation.error.errors,
        formType: "user",
      });
    }

    // 검증된 데이터 사용
    const { email: validatedEmail, password, name, phone } = validation.data;
    email = validatedEmail; // email 변수에 저장

    // 캡차 인증 확인 (내부 함수 사용)
    await verifyTurnstile(turnstileToken, request);

    // Supabase Auth를 통한 사용자 생성
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          phone: phone,
        },
      },
    });

    if (authError) {
      devLog.error("Supabase auth error:", authError);

      // 회원가입 실패 로그 기록 - 템플릿 활용
      await createSystemLog(
        "USER_CREATE_FAILED",
        LOG_MESSAGES.USER_CREATE_FAILED(email, authError.message),
        "error",
        { id: "00000000-0000-0000-0000-000000000000", email: email },
        "user",
        email, // 이메일을 resourceId로 사용
        {
          action_type: "auth_event",
          event: "user_create_failed",
          error_message: authError.message,
          email: email,
        },
        request
      );

      const result = getErrorResultFromRawError(authError, {
        operation: "register",
        email: email,
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

    user = authData.user; // user 변수에 저장

    // 활성화된 약관 조회
    const activeTerms = await prisma.terms_management.findMany({
      where: {
        is_active: true,
        type: {
          in: ["privacy_consent", "terms", "marketing", "age_consent"],
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

    // 필수 연령 동의 저장
    if (ageConsent) {
      const ageTermId = termIdMap.get("age_consent");
      if (ageTermId) {
        consentRecords.push({
          user_id: user.id,
          term_id: ageTermId,
          agreed: true,
          agreed_at: now,
        });
      }
    }
    // 필수 약관 동의 저장
    if (privacyConsent) {
      const privacyTermId = termIdMap.get("privacy_consent");
      if (privacyTermId) {
        consentRecords.push({
          user_id: user.id,
          term_id: privacyTermId,
          agreed: true,
          agreed_at: now,
        });
      }
    }
    // 필수 이용약관 동의 저장
    if (termsConsent) {
      const termsTermId = termIdMap.get("terms");
      if (termsTermId) {
        consentRecords.push({
          user_id: user.id,
          term_id: termsTermId,
          agreed: true,
          agreed_at: now,
        });
      }
    }

    // 선택적 마케팅 정보 수신 동의 저장
    if (marketingConsent) {
      const marketingTermId = termIdMap.get("marketing");
      if (marketingTermId) {
        consentRecords.push({
          user_id: user.id,
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
      LOG_MESSAGES.USER_CREATED(name, email),
      "info",
      { id: user.id, email: email },
      "user",
      user.id,
      {
        action_type: "auth_event", // action_type 추가
        event: "user_created",
        user_id: user.id,
        email: email,
        name: name,
        phone: phone,
        privacy_consent: privacyConsent,
        terms_consent: termsConsent,
        marketing_consent: marketingConsent,
        age_consent: ageConsent,
      },
      request
    );

    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
        user: {
          id: user.id,
          email: email,
          name: name,
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
      user
        ? { id: user.id, email: user.email || email || "unknown" }
        : undefined, // user 정보가 있으면 사용
      "user",
      user?.id || email || "registration_system_error", // user ID 또는 email을 resourceId로 사용
      {
        action_type: "auth_event",
        event: "user_create_system_error",
        error_message: errorMessage,
        user_id: user?.id, // 추가된 user ID
        user_email: user?.email, // 추가된 user email
        email: email || "unknown", // 원본 이메일
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
