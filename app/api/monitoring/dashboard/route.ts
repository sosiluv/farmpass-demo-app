import { google } from "googleapis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { logApiError, logSystemWarning } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { prisma } from "@/lib/prisma";

// 시스템 헬스체크 데이터 패치
async function fetchHealthCheck(baseUrl: string) {
  const res = await fetch(new URL("/api/health", baseUrl), {
    cache: "no-store",
  });
  return res.json();
}

// UptimeRobot 상태 데이터 패치
async function fetchUptimeStatus() {
  // UptimeRobot 설정 확인
  const uptimeRobotApiKey = process.env.UPTIMEROBOT_API_KEY;

  if (!uptimeRobotApiKey) {
    return {
      success: false,
      error: "UPTIMEROBOT_API_KEY_NOT_CONFIGURED",
      message: "UptimeRobot API 키가 설정되지 않았습니다.",
      details: "환경 변수 UPTIMEROBOT_API_KEY를 설정해주세요.",
      monitors: [],
    };
  }

  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        api_key: uptimeRobotApiKey,
        format: "json",
        logs: 1,
        custom_uptime_ratios: "30",
      }),
    });

    if (!res.ok) {
      throw new Error(
        `UptimeRobot API 응답 오류: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();

    // UptimeRobot API 에러 확인
    if (data.stat !== "ok") {
      throw new Error(data.error?.message || "UptimeRobot API 에러");
    }

    return {
      success: true,
      stat: data.stat,
      monitors: data.monitors || [],
    };
  } catch (error) {
    return {
      success: false,
      error: "UPTIMEROBOT_API_ERROR",
      message: "UptimeRobot API 호출에 실패했습니다.",
      details: error instanceof Error ? error.message : "Unknown error",
      monitors: [],
    };
  }
}

// Google Analytics(GA4) 데이터 패치
async function fetchAnalyticsData() {
  // GA 설정 확인
  const gaServiceAccountKey = process.env.GA_SERVICE_ACCOUNT_KEY;
  const gaPropertyId = process.env.GA4_PROPERTY_ID;

  if (!gaServiceAccountKey || !gaPropertyId) {
    return {
      success: false,
      error: "GA_CONFIG_NOT_FOUND",
      message: "Google Analytics 설정이 완료되지 않았습니다.",
      details:
        "환경 변수 GA_SERVICE_ACCOUNT_KEY와 GA4_PROPERTY_ID를 설정해주세요.",
      visitors: 0,
      pageviews: 0,
      avgDuration: 0,
    };
  }

  try {
    // GA 서비스 계정 키 JSON 파싱 검증
    let credentials;
    try {
      credentials = JSON.parse(gaServiceAccountKey);
    } catch (parseError) {
      return {
        success: false,
        error: "GA_JSON_PARSE_ERROR",
        message:
          "Google Analytics 서비스 계정 키 JSON 형식이 올바르지 않습니다.",
        details:
          parseError instanceof Error ? parseError.message : "JSON 파싱 실패",
        visitors: 0,
        pageviews: 0,
        avgDuration: 0,
      };
    }

    // 필수 필드 검증
    if (!credentials.client_email || !credentials.private_key) {
      return {
        success: false,
        error: "GA_CREDENTIALS_INVALID",
        message:
          "Google Analytics 서비스 계정 키에 필수 필드가 누락되었습니다.",
        details: "client_email 또는 private_key가 없습니다.",
        visitors: 0,
        pageviews: 0,
        avgDuration: 0,
      };
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: "https://www.googleapis.com/auth/analytics.readonly",
    });
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const [
      visitors,
      pageviews,
      sessions,
      newUsers,
      bounceRate,
      avgSessionDuration,
    ] = await Promise.all([
      analyticsData.properties.runReport({
        property: `properties/${gaPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "activeUsers" }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${gaPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "screenPageViews" }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${gaPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "sessions" }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${gaPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "newUsers" }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${gaPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "bounceRate" }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${gaPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "averageSessionDuration" }],
        },
      }),
    ]);

    return {
      success: true,
      visitors: Number(visitors.data.rows?.[0]?.metricValues?.[0]?.value || 0),
      pageviews: Number(
        pageviews.data.rows?.[0]?.metricValues?.[0]?.value || 0
      ),
      sessions: Number(sessions.data.rows?.[0]?.metricValues?.[0]?.value || 0),
      newUsers: Number(newUsers.data.rows?.[0]?.metricValues?.[0]?.value || 0),
      bounceRate: Number(
        bounceRate.data.rows?.[0]?.metricValues?.[0]?.value || 0
      ),
      avgDuration: Number(
        avgSessionDuration.data.rows?.[0]?.metricValues?.[0]?.value || 0
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: "GA_API_ERROR",
      message: "Google Analytics API 호출에 실패했습니다.",
      details: error instanceof Error ? error.message : "Unknown error",
      visitors: 0,
      pageviews: 0,
      avgDuration: 0,
    };
  }
}

// 에러 로그 데이터 패치
async function fetchErrorLogs() {
  try {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const logs = await prisma.system_logs.findMany({
      where: {
        level: "error",
        created_at: {
          gte: hoursAgo,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50,
    });

    const formattedLogs = logs.map((log: any) => {
      let context = undefined;
      if (log.metadata) {
        try {
          if (typeof log.metadata === "object") {
            context = log.metadata;
          } else {
            context = JSON.parse(log.metadata);
          }
        } catch (error) {
          context = { raw: log.metadata };
        }
      }
      return {
        timestamp: log.created_at,
        level: log.level,
        message: log.message,
        context,
      };
    });

    return formattedLogs;
  } catch (error) {
    return {
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "데이터베이스 에러 발생",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 🔒 관리자 권한 확인 (admin만 접근 가능)
    const { requireAuth } = await import("@/lib/server/auth-utils");
    const authResult = await requireAuth(true); // admin 권한 필수
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const host = headers().get("host") || "localhost:3000";
    const baseUrl = `${
      process.env.NODE_ENV === "production" ? "https" : "http"
    }://${host}`;

    const [healthCheck, uptimeStatus, analyticsData, errorLogs] =
      await Promise.allSettled([
        fetchHealthCheck(baseUrl),
        fetchUptimeStatus(),
        fetchAnalyticsData(),
        fetchErrorLogs(),
      ]);

    // 각 서비스의 실패 상태 확인 및 로깅
    if (healthCheck.status === "rejected") {
      await logSystemWarning(
        "monitoring_health_check_failed",
        "헬스 체크 데이터 조회 실패",
        { ip: clientIP, userAgent },
        {
          success: false,
          error: "HEALTH_CHECK_FAILED",
          message: healthCheck.reason,
        }
      );
    }

    if (uptimeStatus.status === "rejected") {
      await logSystemWarning(
        "monitoring_uptime_failed",
        "업타임 상태 조회 실패",
        { ip: clientIP, userAgent },
        {
          success: false,
          error: "UPTIME_CHECK_FAILED",
          message: uptimeStatus.reason,
        }
      );
    }

    if (analyticsData.status === "rejected") {
      await logSystemWarning(
        "monitoring_analytics_failed",
        "GA4 데이터 조회 실패",
        { ip: clientIP, userAgent },
        {
          success: false,
          error: "ANALYTICS_CHECK_FAILED",
          message: analyticsData.reason,
        }
      );
    }

    if (errorLogs.status === "rejected") {
      await logSystemWarning(
        "monitoring_error_logs_failed",
        "에러 로그 조회 실패",
        { ip: clientIP, userAgent },
        {
          success: false,
          error: "ERROR_LOGS_CHECK_FAILED",
          message: errorLogs.reason,
        }
      );
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: {
        health:
          healthCheck.status === "fulfilled"
            ? healthCheck.value
            : {
                success: false,
                error: "HEALTH_CHECK_FAILED",
                message: healthCheck.reason,
              },
        uptime:
          uptimeStatus.status === "fulfilled"
            ? uptimeStatus.value
            : {
                success: false,
                error: "UPTIME_CHECK_FAILED",
                message: uptimeStatus.reason,
              },
        analytics:
          analyticsData.status === "fulfilled"
            ? analyticsData.value
            : {
                success: false,
                error: "ANALYTICS_CHECK_FAILED",
                message: analyticsData.reason,
              },
        errors:
          errorLogs.status === "fulfilled"
            ? errorLogs.value
            : {
                success: false,
                error: "ERROR_LOGS_CHECK_FAILED",
                message: errorLogs.reason,
              },
      },
      meta: {
        uptimeConfigured: !!process.env.UPTIMEROBOT_API_KEY,
        analyticsConfigured: !!(
          process.env.GA_SERVICE_ACCOUNT_KEY && process.env.GA4_PROPERTY_ID
        ),
      },
    });
  } catch (error) {
    devLog.error("Failed to fetch monitoring data:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/monitoring/dashboard",
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
        error: "MONITORING_DASHBOARD_ERROR",
        message: "모니터링 대시보드 데이터 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
