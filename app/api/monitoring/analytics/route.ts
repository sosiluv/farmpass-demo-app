import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { logSystemWarning } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

// Google Analytics(GA4) 데이터 패치
async function fetchAnalyticsData() {
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

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(true); // admin 권한 필수
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const analyticsData = await fetchAnalyticsData();
    return NextResponse.json(analyticsData);
  } catch (error) {
    await logSystemWarning(
      "MONITORING_ANALYTICS_FAILED",
      "GA4 데이터 조회 실패",
      { ip: clientIP, userAgent },
      {
        success: false,
        error: "ANALYTICS_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      }
    );
    return NextResponse.json(
      {
        success: false,
        error: "ANALYTICS_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
