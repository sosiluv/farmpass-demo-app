import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getKSTDayBoundsUTC,
  getLastNDaysKSTMidnightsUTC,
} from "@/lib/utils/datetime/date";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(true); // 관리자만 접근
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    // 단일 응답: 통계 + 리스트를 함께 반환 (분기 제거)
    // KST 기준 이번달/지난달 경계 계산
    const now = new Date();
    const thisMonthStartKST = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStartKST = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastMonthEndKST = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );
    const thisMonthEndKST = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const { startUTC: thisMonthStartUTC } =
      getKSTDayBoundsUTC(thisMonthStartKST);
    const { endUTC: thisMonthEndUTC } = getKSTDayBoundsUTC(thisMonthEndKST);
    const { startUTC: lastMonthStartUTC } =
      getKSTDayBoundsUTC(lastMonthStartKST);
    const { endUTC: lastMonthEndUTC } = getKSTDayBoundsUTC(lastMonthEndKST);

    let statsAgg;
    try {
      statsAgg = await prisma.$queryRaw<
        Array<{
          farms_this: bigint;
          owners_this: bigint;
          regions_this: bigint;
          regs_this: bigint;
          farms_last: bigint;
          owners_last: bigint;
          regs_last: bigint;
        }>
      >`select
            (select count(*) from farms where created_at <= ${thisMonthEndUTC}) as farms_this,
            (select count(distinct owner_id) from farms where created_at <= ${thisMonthEndUTC}) as owners_this,
            (select count(distinct coalesce(nullif(split_part(trim(coalesce(farm_address, '')), ' ', 1), ''), '기타'))
               from farms where created_at <= ${thisMonthEndUTC}) as regions_this,
            (select count(*) from farms where created_at between ${thisMonthStartUTC} and ${thisMonthEndUTC}) as regs_this,
            (select count(*) from farms where created_at <= ${lastMonthEndUTC}) as farms_last,
            (select count(distinct owner_id) from farms where created_at <= ${lastMonthEndUTC}) as owners_last,
            (select count(*) from farms where created_at between ${lastMonthStartUTC} and ${lastMonthEndUTC}) as regs_last;`;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "farmsStats" },
        queryError
      );
    }

    const agg = statsAgg[0];
    const totalFarms = Number(agg?.farms_this ?? BigInt(0));
    const totalOwners = Number(agg?.owners_this ?? BigInt(0));
    const totalRegions = Number(agg?.regions_this ?? BigInt(0));
    const monthlyRegistrations = Number(agg?.regs_this ?? BigInt(0));

    const lastFarms = Number(agg?.farms_last ?? BigInt(0));
    const lastOwners = Number(agg?.owners_last ?? BigInt(0));
    const lastRegs = Number(agg?.regs_last ?? BigInt(0));

    const calcTrend = (cur: number, prev: number) =>
      prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

    const startUTC = getLastNDaysKSTMidnightsUTC(30)[0];
    const { endUTC } = getKSTDayBoundsUTC(new Date());

    let rows;
    try {
      rows = await prisma.$queryRaw<
        Array<{
          id: string;
          name: string | null;
          owner_id: string | null;
          farm_address: string | null;
          farm_name: string | null;
          farm_type: string | null;
          farm_detailed_address: string | null;
          is_active: boolean | null;
          manager_name: string | null;
          manager_phone: string | null;
          description: string | null;
          created_at: Date;
          member_count: bigint;
          visitor_count: bigint;
        }>
      >`select f.id,
              p.name,
              f.owner_id,
              f.farm_address,
              f.farm_name,
              f.farm_type,
              f.farm_detailed_address,
              f.is_active,
              f.manager_name,
              f.manager_phone,
              f.description,
              f.created_at,
              (select count(*) from farm_members fm where fm.farm_id = f.id) as member_count,
              (select count(*) from visitor_entries ve where ve.farm_id = f.id and ve.visit_datetime between ${startUTC} and ${endUTC}) as visitor_count
          from farms f
          left join profiles p on p.id = f.owner_id
          order by f.created_at desc;`;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "farmList" },
        queryError
      );
    }

    const farms = rows.map((r) => ({
      id: r.id,
      owner_id: r.owner_id,
      owner_name: r.name ?? "알 수 없음",
      farm_address: r.farm_address,
      farm_name: r.farm_name,
      farm_type: r.farm_type,
      farm_detailed_address: r.farm_detailed_address,
      is_active: r.is_active ?? true,
      manager_name: r.manager_name,
      manager_phone: r.manager_phone,
      description: r.description,
      created_at: r.created_at as unknown as string,
      member_count: Number(r.member_count ?? BigInt(0)),
      visitor_count: Number(r.visitor_count ?? BigInt(0)),
    }));

    return NextResponse.json({
      stats: {
        totalFarms,
        totalOwners,
        totalRegions,
        monthlyRegistrations,
        trends: {
          farmGrowth: calcTrend(totalFarms, lastFarms),
          farmOwnersTrend: calcTrend(totalOwners, lastOwners),
          registrationTrend: calcTrend(monthlyRegistrations, lastRegs),
        },
      },
      farms,
    });
  } catch (e: any) {
    const result = getErrorResultFromRawError(e, {
      operation: "admin_farms_route",
    });
    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
