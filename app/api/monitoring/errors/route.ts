import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";
import { requireAuth } from "@/lib/server/auth-utils";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

// 에러 로그 데이터 패치
async function fetchErrorLogs() {
  try {
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);
    let logs;
    try {
      logs = await prisma.system_logs.findMany({
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
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "errorLogs",
        },
        queryError
      );
    }
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
    throwBusinessError(
      "GENERAL_QUERY_FAILED",
      {
        resourceType: "errorLogs",
      },
      error
    );
  }
}

export async function GET(request: NextRequest) {
  let user = null;

  try {
    const authResult = await requireAuth(true); // admin 권한 필수
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;
    const errorLogs = await fetchErrorLogs();
    return NextResponse.json(errorLogs);
  } catch (error) {
    // 모니터링 에러 로그 조회 시스템 오류 로그
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "MONITORING_ERROR_LOGS_FAILED",
      LOG_MESSAGES.ERROR_LOGS_CHECK_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "monitoring_errors",
      {
        action_type: "monitoring_event",
        event: "error_logs_check_failed",
        error_message: errorMessage,
        user_id: user?.id,
        user_email: user?.email,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "get_error_logs",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
