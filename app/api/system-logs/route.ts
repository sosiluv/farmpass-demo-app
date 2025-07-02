import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const body = await request.json();
    const {
      action,
      message,
      level = "info",
      userId,
      resourceType,
      resourceId,
      metadata,
      userEmail,
      userIP,
    } = body;

    // Supabase 클라이언트 생성 (서버사이드에서 service role 사용)
    const supabase = await createClient();

    // 현재 인증된 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      devLog.error("Auth error in system log API:", authError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // 로그 데이터 준비
    const logData = {
      user_id: userId || user?.id,
      user_email: userEmail || user?.email,
      action,
      message,
      level,
      user_ip: userIP || clientIP,
      user_agent: userAgent,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };

    // 시스템 로그 삽입
    const { error } = await supabase.from("system_logs").insert(logData);

    if (error) {
      devLog.error("Failed to create system log via API:", error);
      return NextResponse.json(
        { error: "Failed to create system log", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    devLog.error("Exception in system log API:", error);

    // API 에러 로그 기록 (단, 로그 시스템 자체 오류이므로 간단하게)
    await logApiError(
      "/api/system-logs",
      "POST",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    ).catch(() => {
      // 로그 시스템 자체에 문제가 있을 수 있으므로 에러를 무시
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
