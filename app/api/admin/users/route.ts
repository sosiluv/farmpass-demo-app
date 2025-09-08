import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import { getKSTDayBoundsUTC } from "@/lib/utils/datetime/date";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(true);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    // 통계 집계
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
    const { startUTC: todayStart, endUTC: todayEnd } = getKSTDayBoundsUTC(
      new Date()
    );

    let rows;
    try {
      rows = await prisma.$queryRaw<
        Array<{
          total_users: bigint;
          active_users: bigint;
          farm_owners: bigint;
          today_logins: bigint;
          total_users_this: bigint;
          total_users_last: bigint;
          active_users_this: bigint;
          active_users_last: bigint;
          farm_owners_this: bigint;
          farm_owners_last: bigint;
        }>
      >`select
          (select count(*) from profiles) as total_users,
          (select count(*) from profiles where is_active) as active_users,
          (select count(distinct fm.user_id) from farm_members fm where fm.role = 'owner') as farm_owners,
          (select count(*) from profiles where last_login_at between ${todayStart} and ${todayEnd}) as today_logins,
          (select count(*) from profiles where created_at <= ${thisMonthEnd}) as total_users_this,
          (select count(*) from profiles where created_at <= ${lastMonthEnd}) as total_users_last,
          (select count(*) from profiles where is_active and created_at <= ${thisMonthEnd}) as active_users_this,
          (select count(*) from profiles where is_active and created_at <= ${lastMonthEnd}) as active_users_last,
          (select count(distinct fm.user_id) from farm_members fm join profiles p on p.id = fm.user_id where fm.role = 'owner' and p.created_at <= ${thisMonthEnd}) as farm_owners_this,
          (select count(distinct fm.user_id) from farm_members fm join profiles p on p.id = fm.user_id where fm.role = 'owner' and p.created_at <= ${lastMonthEnd}) as farm_owners_last;`;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "users_aggregate" },
        queryError
      );
    }

    const agg = rows[0];
    const totalUsers = Number(agg?.total_users ?? BigInt(0));
    const activeUsers = Number(agg?.active_users ?? BigInt(0));
    const farmOwners = Number(agg?.farm_owners ?? BigInt(0));
    const todayLogins = Number(agg?.today_logins ?? BigInt(0));

    const totalUsersThis = Number(agg?.total_users_this ?? BigInt(0));
    const totalUsersLast = Number(agg?.total_users_last ?? BigInt(0));
    const activeUsersThis = Number(agg?.active_users_this ?? BigInt(0));
    const activeUsersLast = Number(agg?.active_users_last ?? BigInt(0));
    const farmOwnersThis = Number(agg?.farm_owners_this ?? BigInt(0));
    const farmOwnersLast = Number(agg?.farm_owners_last ?? BigInt(0));

    const calcTrend = (cur: number, prev: number) =>
      prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

    // 사용자 목록 (역할 정보 포함)
    let users;
    try {
      users = await prisma.profiles.findMany({
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          account_type: true,
          is_active: true,
          last_login_at: true,
          profile_image_url: true,
          created_at: true,
          updated_at: true,
          phone: true,
          company_name: true,
          business_type: true,
          company_address: true,
          farm_members: {
            select: {
              id: true,
              role: true,
              created_at: true,
              farms: {
                select: { id: true, farm_name: true },
              },
            },
          },
        },
      });
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "users_list" },
        queryError
      );
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        farmOwners,
        todayLogins,
        trends: {
          userGrowth: calcTrend(totalUsersThis, totalUsersLast),
          activeUsersTrend: calcTrend(activeUsersThis, activeUsersLast),
          farmOwnersTrend: calcTrend(farmOwnersThis, farmOwnersLast),
          loginsTrend: 0,
        },
      },
      users,
    });
  } catch (e: any) {
    const result = getErrorResultFromRawError(e, {
      operation: "admin_users_route",
    });
    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
