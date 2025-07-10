import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  PerformanceMonitor,
  logApiPerformance,
  logDatabasePerformance,
  logApiError,
} from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import {
  visitorRegistrationRateLimiter,
  createRateLimitHeaders,
} from "@/lib/utils/system/rate-limit";
import { logSecurityError } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const monitor = new PerformanceMonitor("visitors_api_get");
  const { searchParams } = new URL(request.url);
  const includeAllFarms = searchParams.get("includeAllFarms") === "true";

  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 🚦 방문자 조회 전용 Rate Limiting 체크
    // IP당 1분에 10회 방문자 조회 제한
    const rateLimitResult = visitorRegistrationRateLimiter.checkLimit(clientIP);

    if (!rateLimitResult.allowed) {
      // Rate limit 초과 시 보안 로그 기록
      await logSecurityError(
        "RATE_LIMIT_EXCEEDED",
        `IP ${clientIP}에서 방문자 조회 요청 제한 초과`,
        undefined,
        clientIP,
        userAgent
      ).catch((error) => {
        devLog.error(`[VISITORS API] Rate limit logging error: ${error}`);
      });

      // 429 Too Many Requests 응답 반환
      const response = NextResponse.json(
        {
          error: "방문자 조회 요청이 너무 많습니다. 1분 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );

      // Rate limit 헤더 추가
      const headers = createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();
    devLog.log("🔍 [API] Supabase 클라이언트 생성 완료");

    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      const duration = await monitor.finish();
      await logApiPerformance({
        endpoint: "/api/visitors",
        method: "GET",
        duration_ms: duration,
        status_code: 401,
        response_size: 0,
      });

      return authResult.response!;
    }

    const user = authResult.user;
    const isAdmin = authResult.isAdmin || false;

    // 방문자 데이터 조회 쿼리
    let visitorQuery = supabase
      .from("visitor_entries")
      .select(
        `
        *,
        farms(
          id,
          farm_name,
          farm_type,
          farm_address,
          owner_id
        )
      `
      )
      .order("visit_datetime", { ascending: false });

    devLog.log("🔍 [API] 기본 쿼리 생성 완료");

    // 관리자가 아니거나 includeAllFarms가 false인 경우 권한 제한
    if (!isAdmin || !includeAllFarms) {
      // 사용자가 소유하거나 관리하는 농장의 방문자만 조회
      const { data: userFarms } = await supabase
        .from("farms")
        .select("id")
        .or(`owner_id.eq.${user.id},farm_members.user_id.eq.${user.id}`);

      if (!userFarms || userFarms.length === 0) {
        const duration = await monitor.finish();
        await logApiPerformance(
          {
            endpoint: "/api/visitors",
            method: "GET",
            duration_ms: duration,
            status_code: 200,
            response_size: JSON.stringify({ visitors: [] }).length,
          },
          user.id
        );

        return NextResponse.json({ visitors: [] });
      }

      const farmIds = userFarms.map((farm: any) => farm.id);
      visitorQuery = visitorQuery.in("farm_id", farmIds);
      devLog.log("🔍 [API] 농장 ID 필터 적용", { farmIds });
    } else {
      devLog.log("🔍 [API] 관리자 전체 조회 모드");
    }

    const dbMonitor = new PerformanceMonitor("visitors_database_query");
    const { data: visitorData, error: visitorError } = await visitorQuery;
    const dbDuration = await dbMonitor.finish();

    await logDatabasePerformance(
      {
        query: "SELECT visitors with farms",
        table: "visitor_entries",
        duration_ms: dbDuration,
        row_count: visitorData?.length || 0,
      },
      user.id
    );

    devLog.log("🔍 [API] 방문자 쿼리 실행 결과", {
      visitorCount: visitorData?.length || 0,
      hasError: !!visitorError,
      errorMessage: visitorError?.message,
      firstVisitor: visitorData?.[0] || null,
    });

    if (visitorError) {
      devLog.error("방문자 조회 오류:", visitorError);

      const duration = await monitor.finish();
      await logApiError(
        "/api/visitors",
        "GET",
        visitorError instanceof Error
          ? visitorError.message
          : String(visitorError),
        undefined,
        {
          ip: clientIP,
          userAgent,
        }
      );
      await logApiPerformance(
        {
          endpoint: "/api/visitors",
          method: "GET",
          duration_ms: duration,
          status_code: 500,
          response_size: 0,
        },
        user.id
      );

      return NextResponse.json(
        { error: `쿼리 오류: ${visitorError.message}` },
        { status: 500 }
      );
    }

    // 시스템 로그 기록
    await createSystemLog(
      "VISITOR_DATA_ACCESS",
      `방문자 데이터 접근: ${visitorData?.length || 0}건 조회 (${
        includeAllFarms ? "전체 농장" : "소유 농장"
      })`,
      "info",
      user.id,
      "visitor",
      undefined,
      {
        visitor_count: visitorData?.length || 0,
        access_scope: includeAllFarms ? "all_farms" : "own_farms",
        metadata: {
          ipAddress: clientIP,
          userAgent: userAgent,
        },
      },
      user.email,
      clientIP,
      userAgent
    );

    const duration = await monitor.finish();
    const responseData = { visitors: visitorData || [] };
    await logApiPerformance(
      {
        endpoint: "/api/visitors",
        method: "GET",
        duration_ms: duration,
        status_code: 200,
        response_size: JSON.stringify(responseData).length,
      },
      user.id
    );

    return NextResponse.json(responseData, {
      headers: {
        ...createRateLimitHeaders(rateLimitResult),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const duration = await monitor.finish();
    devLog.error("전체 방문자 조회 실패:", error);

    await logApiError(
      "/api/visitors",
      "GET",
      error instanceof Error ? error.message : "Unknown error",
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );
    await logApiPerformance({
      endpoint: "/api/visitors",
      method: "GET",
      duration_ms: duration,
      status_code: 500,
      response_size: 0,
    });

    return NextResponse.json(
      { error: "방문자 데이터 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 🚦 방문자 등록 전용 Rate Limiting 체크
  // IP당 1분에 10회 방문자 등록 제한
  const rateLimitResult = visitorRegistrationRateLimiter.checkLimit(clientIP);

  if (!rateLimitResult.allowed) {
    // Rate limit 초과 시 보안 로그 기록
    await logSecurityError(
      "RATE_LIMIT_EXCEEDED",
      `IP ${clientIP}에서 방문자 등록 요청 제한 초과`,
      undefined,
      clientIP,
      userAgent
    ).catch((error) => {
      devLog.error(`[VISITORS API] Rate limit logging error: ${error}`);
    });

    // 429 Too Many Requests 응답 반환
    const response = NextResponse.json(
      {
        error: "방문자 등록 요청이 너무 많습니다. 1분 후 다시 시도해주세요.",
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 }
    );

    // Rate limit 헤더 추가
    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // 기존 방문자 등록 로직...
  try {
    const supabase = await createClient();
    const body = await request.json();

    // 방문자 데이터 검증 및 저장 로직
    const { data, error } = await supabase
      .from("visitors")
      .insert([body])
      .select()
      .single();

    if (error) {
      // 방문자 등록 실패 로그 기록
      await createSystemLog(
        "VISITOR_REGISTRATION_FAILED",
        "방문자 등록에 실패했습니다.",
        "error",
        undefined,
        "visitor",
        undefined,
        {
          error: error.message,
          visitor_data: body,
        },
        undefined,
        clientIP,
        userAgent
      );

      return NextResponse.json(
        { error: "방문자 등록에 실패했습니다." },
        { status: 400 }
      );
    }

    // 방문자 등록 성공 로그 기록
    await createSystemLog(
      "VISITOR_REGISTRATION_SUCCESS",
      "새로운 방문자가 등록되었습니다.",
      "info",
      undefined,
      "visitor",
      data.id,
      {
        visitor_id: data.id,
        visitor_data: body,
      },
      undefined,
      clientIP,
      userAgent
    );

    // 성공 응답에 Rate limit 헤더 추가
    const response = NextResponse.json(
      {
        message: "방문자가 성공적으로 등록되었습니다.",
        visitor: data,
      },
      { status: 201 }
    );

    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    devLog.error("방문자 등록 API 오류:", error);

    // 방문자 등록 예외 로그 기록
    await createSystemLog(
      "VISITOR_REGISTRATION_EXCEPTION",
      "방문자 등록 중 예외가 발생했습니다.",
      "error",
      undefined,
      "visitor",
      undefined,
      {
        error: error instanceof Error ? error.message : String(error),
      },
      undefined,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
