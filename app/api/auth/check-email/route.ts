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
    return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });
  }

  try {
    const existingUser = await prisma.profiles.findFirst({
      where: { email: email },
      select: { id: true },
    });

    return NextResponse.json({
      isDuplicate: !!existingUser,
      message: existingUser ? "Email is already in use." : "",
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

    return NextResponse.json({ error: "EMAIL_CHECK_ERROR" }, { status: 500 });
  }
}
