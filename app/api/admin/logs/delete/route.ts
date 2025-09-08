import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

export async function POST(request: NextRequest) {
  let user = null;
  try {
    // 관리자 권한 인증 확인
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;

    const body = await request.json();
    const { action, logId, beforeCount } = body;

    let result;
    let logMessage = "";

    switch (action) {
      case "delete_single":
        // 개별 로그 삭제
        try {
          await prisma.system_logs.delete({ where: { id: logId } });
        } catch (error: any) {
          throwBusinessError(
            "GENERAL_DELETE_FAILED",
            {
              resourceType: "log",
            },
            error
          );
        }

        result = { deleted: true, logId };
        logMessage = LOG_MESSAGES.LOG_CLEANUP_FAILED(user.email || "");
        break;

      case "delete_all":
        // 전체 로그 삭제
        try {
          await prisma.system_logs.deleteMany({});
        } catch (error: any) {
          throwBusinessError(
            "GENERAL_DELETE_FAILED",
            {
              resourceType: "log",
            },
            error
          );
        }

        result = { deleted: true, count: beforeCount };
        logMessage = LOG_MESSAGES.LOG_CLEANUP(user.email || "", beforeCount);
        break;

      case "delete_old":
        // 30일 이전 로그 삭제
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let oldLogsCount;
        try {
          oldLogsCount = await prisma.system_logs.count({
            where: {
              created_at: {
                lt: thirtyDaysAgo,
              },
            },
          });
        } catch (error: any) {
          throwBusinessError(
            "GENERAL_QUERY_FAILED",
            {
              resourceType: "errorLogs",
            },
            error
          );
        }

        if (!oldLogsCount) {
          result = { deleted: false, count: 0 };
          logMessage = "삭제할 30일 이전 로그가 없습니다.";
        } else {
          try {
            await prisma.system_logs.deleteMany({
              where: {
                created_at: {
                  lt: thirtyDaysAgo,
                },
              },
            });
          } catch (error: any) {
            throwBusinessError(
              "GENERAL_DELETE_FAILED",
              {
                resourceType: "log",
              },
              error
            );
          }

          result = { deleted: true, count: oldLogsCount };
          logMessage = LOG_MESSAGES.LOG_CLEANUP(user.email || "", oldLogsCount);
        }
        break;

      default:
        throwBusinessError("UNSUPPORTED_DELETE_OPERATION", {
          providedAction: action,
        });
    }

    // 삭제 작업 로그 기록 - 템플릿 활용
    await createSystemLog(
      "LOG_CLEANUP",
      LOG_MESSAGES.LOG_CLEANUP(user.email || "", result.count || 1),
      "info",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "logs_cleanup",
      {
        action_type: "admin_event",
        event: "log_cleanup",
        action,
        count: result.count || 1,
      },
      request
    );

    // 작업 유형에 따른 구체적인 메시지 생성
    let successMessage = "";
    switch (action) {
      case "delete_single":
        successMessage = "로그가 삭제되었습니다.";
        break;
      case "delete_all":
        successMessage = `${beforeCount}개의 로그가 삭제되었습니다.`;
        break;
      case "delete_old":
        successMessage =
          result.count > 0
            ? `${result.count}개의 오래된 로그가 삭제되었습니다.`
            : "삭제할 오래된 로그가 없습니다.";
        break;
      default:
        successMessage = "로그 삭제가 완료되었습니다.";
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      result,
    });
  } catch (error) {
    devLog.error("[LOG-DELETE] 로그 삭제 API 오류:", error);

    // 시스템 에러 로깅
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "LOG_CLEANUP_FAILED",
      LOG_MESSAGES.LOG_CLEANUP_FAILED(errorMessage),
      "error",
      user?.id ? { id: user.id, email: user.email || "" } : undefined,
      "system",
      "logs_cleanup",
      {
        action_type: "admin_event",
        event: "log_cleanup_failed",
        error_message: errorMessage,
      },
      request
    );

    // 통합 에러 처리 - 비즈니스 에러와 시스템 에러를 모두 처리
    const result = getErrorResultFromRawError(error, {
      operation: "delete_logs",
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
