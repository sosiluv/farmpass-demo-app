import { NextRequest, NextResponse } from "next/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_TURNSTILE_TOKEN",
          message: "캡차 토큰이 필요합니다.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
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
      await logApiError(
        "/api/auth/verify-turnstile",
        "POST",
        `Turnstile verification failed: ${verificationResult[
          "error-codes"
        ]?.join(", ")}`,
        undefined,
        {
          ip: clientIP,
          userAgent,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "TURNSTILE_VERIFICATION_FAILED",
          message: "Turnstile 검증에 실패했습니다.",
          details: verificationResult["error-codes"],
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // 검증 성공
    return NextResponse.json(
      {
        success: true,
        message: "Turnstile verification completed.",
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

    await logApiError(
      "/api/auth/verify-turnstile",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: "TURNSTILE_SYSTEM_ERROR",
        message: "Turnstile 시스템 오류가 발생했습니다.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}
