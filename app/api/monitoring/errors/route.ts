import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSystemWarning } from "@/lib/utils/logging/system-log";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";

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
  const authResult = await requireAuth(true); // admin 권한 필수
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  try {
    const errorLogs = await fetchErrorLogs();
    return NextResponse.json(errorLogs);
  } catch (error) {
    await logSystemWarning(
      "MONITORING_ERROR_LOGS_FAILED",
      "에러 로그 조회 실패",
      { ip: clientIP, userAgent },
      {
        success: false,
        error: "ERROR_LOGS_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      }
    );
    return NextResponse.json(
      {
        success: false,
        error: "ERROR_LOGS_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
