import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) return authResult.response!;

    const now = new Date();
    const thisMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      0,
      23,
      59,
      59
    );

    let rows;
    try {
      rows = await prisma.$queryRaw<
        Array<{
          total_all: bigint;
          info_all: bigint;
          warn_all: bigint;
          error_all: bigint;
          total_this: bigint;
          total_last: bigint;
          info_this: bigint;
          info_last: bigint;
          warn_this: bigint;
          warn_last: bigint;
          error_this: bigint;
          error_last: bigint;
        }>
      >`select
          (select count(*) from system_logs) as total_all,
          (select count(*) from system_logs where level = 'info') as info_all,
          (select count(*) from system_logs where level = 'warn') as warn_all,
          (select count(*) from system_logs where level = 'error') as error_all,
          (select count(*) from system_logs where created_at <= ${thisMonthEnd}) as total_this,
          (select count(*) from system_logs where created_at <= ${lastMonthEnd}) as total_last,
          (select count(*) from system_logs where created_at <= ${thisMonthEnd} and level = 'info') as info_this,
          (select count(*) from system_logs where created_at <= ${lastMonthEnd} and level = 'info') as info_last,
          (select count(*) from system_logs where created_at <= ${thisMonthEnd} and level = 'warn') as warn_this,
          (select count(*) from system_logs where created_at <= ${lastMonthEnd} and level = 'warn') as warn_last,
          (select count(*) from system_logs where created_at <= ${thisMonthEnd} and level = 'error') as error_this,
          (select count(*) from system_logs where created_at <= ${lastMonthEnd} and level = 'error') as error_last;`;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "logsAggregations" },
        queryError
      );
    }

    const agg = rows[0];
    const totalLogs = Number(agg?.total_all ?? BigInt(0));
    const infoLogs = Number(agg?.info_all ?? BigInt(0));
    const warningLogs = Number(agg?.warn_all ?? BigInt(0));
    const errorLogs = Number(agg?.error_all ?? BigInt(0));
    const totalThis = Number(agg?.total_this ?? BigInt(0));
    const totalLast = Number(agg?.total_last ?? BigInt(0));
    const infoThis = Number(agg?.info_this ?? BigInt(0));
    const infoLast = Number(agg?.info_last ?? BigInt(0));
    const warnThis = Number(agg?.warn_this ?? BigInt(0));
    const warnLast = Number(agg?.warn_last ?? BigInt(0));
    const errorThis = Number(agg?.error_this ?? BigInt(0));
    const errorLast = Number(agg?.error_last ?? BigInt(0));

    const calcTrend = (cur: number, prev: number) =>
      prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

    const stats = {
      totalLogs,
      infoLogs,
      warningLogs,
      errorLogs,
      trends: { logGrowth: calcTrend(totalThis, totalLast) },
      logTrends: {
        errorTrend: calcTrend(errorThis, errorLast),
        warningTrend: calcTrend(warnThis, warnLast),
        infoTrend: calcTrend(infoThis, infoLast),
      },
    };

    // 로그 목록 (최신순) - 기본 필드만 반환
    let logs;
    try {
      logs = await prisma.system_logs.findMany({
        orderBy: { created_at: "desc" },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "logsList" },
        queryError
      );
    }

    return NextResponse.json({ stats, logs });
  } catch (e: any) {
    const result = getErrorResultFromRawError(e, {
      operation: "admin_logs_route",
    });
    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
