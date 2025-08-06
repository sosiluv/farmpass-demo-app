import { NextRequest, NextResponse } from "next/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { getClientIP } from "@/lib/server/ip-helpers";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    const { token } = await request.json();

    if (!token) {
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["turnstile"],
        operation: "verify_turnstile",
      });
    }

    // Cloudflare Turnstile 검증
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

    devLog.log("Turnstile verification result:", {
      success: verificationResult.success,
      errorCodes: verificationResult["error-codes"],
      clientIP,
    });

    if (!verificationResult.success) {
      // 검증 실패 로그
      const errorMessage = `Turnstile verification failed: ${verificationResult[
        "error-codes"
      ]?.join(", ")}`;

      await createSystemLog(
        "TURNSTILE_VERIFICATION_FAILED",
        LOG_MESSAGES.TURNSTILE_VERIFICATION_FAILED(
          verificationResult["error-codes"] || []
        ),
        "error",
        undefined,
        "system",
        undefined,
        {
          action_type: "auth_event",
          event: "turnstile_verification_failed",
          error_message: errorMessage,
        }
      );

      throwBusinessError("TURNSTILE_VERIFICATION_FAILED", {
        operation: "verify_turnstile",
        errorCodes: verificationResult["error-codes"],
      });
    }

    // 검증 성공
    return NextResponse.json(
      {
        success: true,
        message: "Turnstile 검증이 완료되었습니다.",
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    devLog.error("Turnstile verification error:", error);

    // 시스템 에러 로깅
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "TURNSTILE_SYSTEM_ERROR",
      LOG_MESSAGES.TURNSTILE_SYSTEM_ERROR(errorMessage),
      "error",
      undefined,
      "system",
      undefined,
      {
        action_type: "auth_event",
        event: "turnstile_system_error",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "verify_turnstile",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}
