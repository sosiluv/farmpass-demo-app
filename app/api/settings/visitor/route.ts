import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { logApiError } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: "System settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      visitor_revisit_interval: settings.reVisitAllowInterval,
      visitor_daily_limit: settings.maxVisitorsPerDay,
      visitor_data_retention: settings.visitorDataRetentionDays,
      visitor_photo_required: settings.requireVisitorPhoto,
      visitor_contact_required: settings.requireVisitorContact,
      visitor_purpose_required: settings.requireVisitPurpose,
    });
  } catch (error) {
    devLog.error("Error fetching visitor settings:", error);

    // API 에러 로그 기록
    await logApiError(
      "/api/settings/visitor",
      "GET",
      error instanceof Error ? error : String(error),
      undefined,
      {
        ip: clientIP,
        userAgent,
      }
    );

    return NextResponse.json(
      { error: "Failed to fetch visitor settings" },
      { status: 500 }
    );
  }
}
