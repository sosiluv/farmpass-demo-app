import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  const email = request.nextUrl.searchParams.get("email");

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

  try {
    const existingUser = await prisma.profiles.findFirst({
      where: { email: email },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      isDuplicate: !!existingUser,
      message: existingUser ? "이미 사용 중인 이메일 주소입니다." : "",
    });
  } catch (error) {
    devLog.error("Email check error:", error);

    // API 에러 로깅
    await logApiError(
      "/api/auth/check-email",
      "GET",
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
        error: "EMAIL_CHECK_ERROR",
        message: "이메일 확인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
