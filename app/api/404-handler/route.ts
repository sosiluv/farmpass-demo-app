import { NextRequest, NextResponse } from "next/server";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logSecurityError } from "@/lib/utils/logging/system-log";
import { maliciousBotRateLimiter } from "@/lib/utils/system/rate-limit";

export async function GET(request: NextRequest) {
  return handleMaliciousRequest(request);
}

export async function POST(request: NextRequest) {
  return handleMaliciousRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleMaliciousRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleMaliciousRequest(request);
}

async function handleMaliciousRequest(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  const pathname = new URL(request.url).pathname;

  // Rate Limiting 적용
  const botLimitResult = maliciousBotRateLimiter.checkLimit(clientIP);
  if (!botLimitResult.allowed) {
    devLog.warn(
      `[404-HANDLER] Malicious bot rate limited: ${pathname} from IP: ${clientIP}`
    );
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": botLimitResult.retryAfter?.toString() || "60",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // 보안 로그 기록
  try {
    await logSecurityError(
      "MALICIOUS_REQUEST_BLOCKED",
      `악성 요청 차단: ${pathname}`,
      undefined,
      clientIP,
      userAgent
    );
  } catch (error) {
    devLog.warn("Security logging failed:", error);
  }

  devLog.warn(
    `[404-HANDLER] Malicious request blocked: ${pathname} from IP: ${clientIP}, UA: ${userAgent}`
  );

  // 404 응답 반환 (로그에는 404로 기록됨)
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "text/plain",
    },
  });
}
