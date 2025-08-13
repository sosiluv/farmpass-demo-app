import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth-utils";
import { devLog } from "@/lib/utils/logging/dev-logger";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
} from "@/lib/utils/error/errorUtil";
import { prisma } from "@/lib/prisma";
import { getKSTDayBoundsUTC } from "@/lib/utils/datetime/date";
import {
  formatTrendPercent,
  formatDiffCount,
  getDisinfectionGrade,
} from "@/lib/utils/data/common-stats";
import { getFarmTypeLabel } from "@/lib/constants/farm-types";
import { throwBusinessError } from "@/lib/utils/error/errorUtil";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 인증/권한: 기존 라우터 패턴(requireAuth) 준수
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }
    const isAdmin = !!authResult.isAdmin;
    const currentUserId = authResult.user.id;

    // 선택 농장 필터 (visitor_entries 관련 집계에만 적용)
    const url = new URL(request.url);
    let farmId = url.searchParams.get("farmId");
    // 역할별 스코프 강제: 일반 사용자는 자신의 농장으로만 집계
    if (!isAdmin) {
      try {
        // 소유/멤버 농장을 단일 쿼리(UNION)로 조회
        const rows = await prisma.$queryRaw<Array<{ id: string }>>`
          select distinct id from (
            select fm.farm_id as id
            from farm_members fm
            where fm.user_id = ${currentUserId}::uuid
            union
            select f.id
            from farms f
            where f.owner_id = ${currentUserId}::uuid
          ) as all_farms;
        `;
        const myFarmIds = rows.map((r) => r.id);

        // 일반 사용자가 농장을 하나도 보유/소속하지 않은 경우: 즉시 0 데이터로 응답
        if (myFarmIds.length === 0) {
          return NextResponse.json({
            totalUsers: 0,
            totalFarms: 0,
            totalVisitors: 0,
            totalLogs: 0,
            trends: {
              userGrowth: 0,
              farmGrowth: 0,
              visitorGrowth: 0,
              logGrowth: 0,
            },
            farmTypeData: [],
            userRoleData: [],
            regionData: [],
            monthlyData: [],
            systemUsageData: [
              { status: "오류 보고됨", count: 0, trend: 0 },
              { status: "정상 작동", count: 0, trend: 0 },
              { status: "점검 필요", count: 0, trend: 0 },
              { status: "최근 활동", count: 0, trend: 0 },
              { status: "QR 스캔 동작", count: 0, trend: 0 },
            ],
            recentActivities: [],
            dashboardStats: {
              totalVisitors: 0,
              todayVisitors: 0,
              weeklyVisitors: 0,
              disinfectionRate: 0,
              trends: {
                totalVisitorsTrend: "데이터 없음",
                todayVisitorsTrend: "데이터 없음",
                weeklyVisitorsTrend: "데이터 없음",
                disinfectionTrend: "데이터 없음",
              },
            },
            visitorTrend: [],
            purposeStats: [],
            timeStats: [],
            weekdayStats: [],
            regionStats: [],
          });
        }

        // 기본: 첫 농장 하나로 제한. farmId가 내 농장일 때만 허용.
        const requestedFarmId = farmId && farmId !== "all" ? farmId : undefined;
        if (requestedFarmId && myFarmIds.includes(requestedFarmId)) {
          farmId = requestedFarmId;
        } else {
          farmId = myFarmIds[0];
        }
      } catch {}
    }
    const hasFarmFilter = !!farmId && farmId !== "all";
    const farmIdParam = hasFarmFilter ? farmId! : null;

    // 총계 (count-only) - raw SQL 단일 쿼리
    let totals;
    try {
      totals = await prisma.$queryRaw<
        Array<{
          total_users: bigint;
          total_farms: bigint;
          total_visitors: bigint;
          total_logs: bigint;
        }>
      >`select
          (select count(*) from profiles)        as total_users,
          (select count(*) from farms)           as total_farms,
          (select count(*) from visitor_entries) as total_visitors,
          (select count(*) from system_logs)     as total_logs;`;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "dashboardTotals" },
        queryError
      );
    }
    const totalUsers = Number(totals[0]?.total_users ?? BigInt(0));
    const totalFarms = Number(totals[0]?.total_farms ?? BigInt(0));
    const totalVisitors = Number(totals[0]?.total_visitors ?? BigInt(0));
    const totalLogs = Number(totals[0]?.total_logs ?? BigInt(0));

    // 오늘/주간/30일 범위 (KST → UTC)
    const now = new Date();
    const { startUTC: todayStart, endUTC: todayEnd } = getKSTDayBoundsUTC(now);
    const { startUTC: weekAgoStart } = getKSTDayBoundsUTC(
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const { startUTC: last30Start } = getKSTDayBoundsUTC(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    const { startUTC: prev30Start } = getKSTDayBoundsUTC(
      new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    );
    const { endUTC: prev30End } = getKSTDayBoundsUTC(
      new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000)
    );
    const { startUTC: yStart, endUTC: yEnd } = getKSTDayBoundsUTC(
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    );

    // 방문자 관련 집계 단일 쿼리 (오늘/주간/최근30/이전30/총합/소독/어제)
    let todayVisitors: number = 0;
    let weeklyVisitors: number = 0;
    let scopedTotalVisitors: number = 0;
    let disinfectedCount: number = 0;
    let yesterdayVisitors: number = 0;
    let last30Count: number = 0;
    let prev30Count: number = 0;
    try {
      const rows = await prisma.$queryRaw<
        Array<{
          today_visitors: bigint;
          week_visitors: bigint;
          last30_visitors: bigint;
          prev30_visitors: bigint;
          total_visitors_scoped: bigint;
          disinfected_count: bigint;
          yesterday_visitors: bigint;
        }>
      >`
        select
          count(*) filter (where v.visit_datetime between ${todayStart} and ${todayEnd})        as today_visitors,
          count(*) filter (where v.visit_datetime between ${weekAgoStart} and ${todayEnd})       as week_visitors,
          count(*) filter (where v.visit_datetime between ${last30Start} and ${todayEnd})        as last30_visitors,
          count(*) filter (where v.visit_datetime between ${prev30Start} and ${prev30End})       as prev30_visitors,
          count(*)                                                                               as total_visitors_scoped,
          count(*) filter (where v.disinfection_check)                                           as disinfected_count,
          count(*) filter (where v.visit_datetime between ${yStart} and ${yEnd})                 as yesterday_visitors
        from visitor_entries v
        where (${farmIdParam}::uuid is null or v.farm_id = ${farmIdParam}::uuid);
      `;
      const vrow = rows?.[0];
      todayVisitors = Number(vrow?.today_visitors ?? BigInt(0));
      weeklyVisitors = Number(vrow?.week_visitors ?? BigInt(0));
      last30Count = Number(vrow?.last30_visitors ?? BigInt(0));
      prev30Count = Number(vrow?.prev30_visitors ?? BigInt(0));
      scopedTotalVisitors = Number(vrow?.total_visitors_scoped ?? BigInt(0));
      disinfectedCount = Number(vrow?.disinfected_count ?? BigInt(0));
      yesterdayVisitors = Number(vrow?.yesterday_visitors ?? BigInt(0));
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "todayVisitors" },
        queryError
      );
    }
    const disinfectionRate =
      scopedTotalVisitors > 0
        ? Math.round((disinfectedCount / scopedTotalVisitors) * 1000) / 10
        : 0;

    // 트랜잭션 내부 병렬 수집 (로그 레벨/농장 분포/역할 분포/지역 분포/월별/최근 로그인/최근 로그/차트집계)
    let levelAgg,
      farmTypeGroups,
      roleAgg,
      regionAgg,
      monthlyAgg,
      recentActiveUsersToday,
      recentAgg,
      chartsAgg;
    try {
      [
        levelAgg,
        farmTypeGroups,
        roleAgg,
        regionAgg,
        monthlyAgg,
        recentActiveUsersToday,
        recentAgg,
        chartsAgg,
      ] = await prisma.$transaction([
        prisma.$queryRaw<
          Array<{ info_count: bigint; warn_count: bigint; error_count: bigint }>
        >`
          select
            count(*) filter (where level = 'info')  as info_count,
            count(*) filter (where level = 'warn')  as warn_count,
            count(*) filter (where level = 'error') as error_count
          from system_logs
          where created_at between ${todayStart} and ${todayEnd};
        `,
        prisma.$queryRaw<Array<{ farm_type: string | null; cnt: bigint }>>`
          select farm_type, count(*) as cnt
          from farms
          group by farm_type
          order by cnt desc;
        `,
        prisma.$queryRaw<
          Array<{
            admin_count: bigint;
            owner_count: bigint;
            manager_count: bigint;
            viewer_count: bigint;
            general_count: bigint;
          }>
        >`
          select
            count(*) filter (where p.account_type = 'admin')                                                    as admin_count,
            count(distinct fm.user_id) filter (where fm.role = 'owner')                                         as owner_count,
            count(distinct fm.user_id) filter (where fm.role = 'manager')                                       as manager_count,
            count(distinct fm.user_id) filter (where fm.role = 'viewer')                                        as viewer_count,
            count(*) filter (
              where p.account_type <> 'admin'
                and not exists (select 1 from farm_members fm2 where fm2.user_id = p.id)
            )                                                                                                   as general_count
          from profiles p
          left join farm_members fm on fm.user_id = p.id;
        `,
        prisma.$queryRaw<Array<{ region: string | null; cnt: bigint }>>`
          select
            coalesce(nullif(split_part(trim(coalesce(farm_address, '')), ' ', 1), ''), '기타') as region,
            count(*) as cnt
          from farms
          group by 1
          order by cnt desc;
        `,
        prisma.$queryRaw<
          Array<{ month_num: number; users: bigint; farms: bigint }>
        >`
          with months as (
            select gs as month_offset,
                   date_trunc('month', (now() at time zone 'Asia/Seoul') + (gs || ' month')::interval) as kst_month_start
            from generate_series(-3, 0) as gs
          )
          select extract(month from kst_month_start)::int as month_num,
                 (select count(*) from profiles where created_at <= ((kst_month_start + interval '1 month' - interval '1 millisecond') at time zone 'Asia/Seoul')) as users,
                 (select count(*) from farms    where created_at <= ((kst_month_start + interval '1 month' - interval '1 millisecond') at time zone 'Asia/Seoul')) as farms
          from months
          order by month_offset;
        `,
        prisma.profiles.count({
          where: { last_login_at: { gte: todayStart, lte: todayEnd } },
        }),
        prisma.$queryRaw<
          Array<{
            id: string;
            action: string;
            message: string;
            created_at: Date;
            user_id: string | null;
            user_name: string | null;
          }>
        >`
          select l.id, l.action, l.message, l.created_at, l.user_id, p.name as user_name
          from system_logs l
          left join profiles p on p.id = l.user_id
          order by l.created_at desc
          limit 5;
        `,
        prisma.$queryRaw<
          Array<{
            trend: any;
            purpose: any;
            hourly: any;
            weekday: any;
            region: any;
          }>
        >`
          with days as (
            select ((now() at time zone 'Asia/Seoul')::date + (gs || ' day')::interval)::date as day_kst
            from generate_series(-29, 0) as gs
          ),
          base_visitors as (
            select *
            from visitor_entries v
            where v.visit_datetime between ${last30Start} and ${todayEnd}
              and (${farmIdParam}::uuid is null or v.farm_id = ${farmIdParam}::uuid)
          )
          select
            (
              select json_agg(json_build_object(
                       'kst_date', to_char(d.day_kst, 'YYYY-MM-DD'),
                       'cnt', coalesce((
                         select count(*) from base_visitors bv
                         where (bv.visit_datetime at time zone 'Asia/Seoul')::date = d.day_kst
                       ), 0)
                     ) order by 1)
              from days d
            ) as trend,
            (
              select json_agg(json_build_object('category', cat, 'cnt', c) order by c desc)
              from (
                select coalesce(nullif(visitor_purpose, ''), '기타') as cat, count(*) as c
                from base_visitors
                group by 1
              ) t
            ) as purpose,
            (
              select json_agg(json_build_object('hour', h, 'cnt', c) order by h)
              from (
                select extract(hour from (visit_datetime at time zone 'Asia/Seoul'))::int as h, count(*) as c
                from base_visitors
                group by 1
              ) t
            ) as hourly,
            (
              select json_agg(json_build_object('dow', d, 'cnt', c) order by d)
              from (
                select extract(dow from (visit_datetime at time zone 'Asia/Seoul'))::int as d, count(*) as c
                from base_visitors
                group by 1
              ) t
            ) as weekday,
            (
              select json_agg(json_build_object('region', r, 'cnt', c) order by c desc)
              from (
                select coalesce(nullif(split_part(trim(coalesce(visitor_address, '')), ' ', 1), ''), '기타') as r,
                       count(*) as c
                from base_visitors
                group by 1
              ) t
            ) as region;
        `,
      ]);
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "dashboardParallel" },
        queryError
      );
    }

    const infoLogs = Number(levelAgg[0]?.info_count ?? BigInt(0));
    const warningLogs = Number(levelAgg[0]?.warn_count ?? BigInt(0));
    const errorLogs = Number(levelAgg[0]?.error_count ?? BigInt(0));

    const farmTypeData = (
      farmTypeGroups as Array<{ farm_type: string | null; cnt: bigint }>
    ).map((g) => ({
      type: getFarmTypeLabel(g.farm_type as any),
      count: Number(g.cnt ?? BigInt(0)),
    }));

    const agg = (roleAgg?.[0] as
      | {
          admin_count: bigint;
          owner_count: bigint;
          manager_count: bigint;
          viewer_count: bigint;
          general_count: bigint;
        }
      | undefined) || {
      admin_count: BigInt(0),
      owner_count: BigInt(0),
      manager_count: BigInt(0),
      viewer_count: BigInt(0),
      general_count: BigInt(0),
    };

    const userRoleData = [
      { role: "시스템 관리자", count: Number(agg.admin_count) },
      { role: "농장주", count: Number(agg.owner_count) },
      { role: "농장 관리자", count: Number(agg.manager_count) },
      { role: "농장 조회자", count: Number(agg.viewer_count) },
      { role: "일반 사용자", count: Number(agg.general_count) },
    ];

    const regionData = regionAgg.map((r) => ({
      region: r.region ?? "기타",
      count: Number(r.cnt),
    }));

    const monthlyData = monthlyAgg.map((r) => ({
      month: `${r.month_num}월`,
      users: Number(r.users ?? BigInt(0)),
      farms: Number(r.farms ?? BigInt(0)),
    }));

    const systemUsageData = [
      {
        status: "오류 보고됨" as const,
        count: errorLogs,
        trend: errorLogs > 0 ? -10 : 0,
      },
      { status: "정상 작동" as const, count: infoLogs, trend: 0 },
      { status: "점검 필요" as const, count: warningLogs, trend: 0 },
      { status: "최근 활동" as const, count: recentActiveUsersToday, trend: 0 },
      { status: "QR 스캔 동작" as const, count: todayVisitors, trend: 0 },
    ];

    const recentActivities = recentAgg.map((row) => ({
      id: row.id,
      type: row.action,
      timestamp: row.created_at as unknown as string,
      details: row.message,
      userName: row.user_name ?? undefined,
    }));

    // 트렌드(단순 예시: 누적 기준)
    // 월간 비교 트렌드 (누적 기준 비교)
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
    let trendAgg;
    try {
      trendAgg = await prisma.$queryRaw<
        Array<{
          users_this: bigint;
          users_last: bigint;
          farms_this: bigint;
          farms_last: bigint;
          visitors_this: bigint;
          visitors_last: bigint;
          logs_this: bigint;
          logs_last: bigint;
        }>
      >`select
          (select count(*) from profiles where created_at <= ${thisMonthEnd})         as users_this,
          (select count(*) from profiles where created_at <= ${lastMonthEnd})         as users_last,
          (select count(*) from farms    where created_at <= ${thisMonthEnd})         as farms_this,
          (select count(*) from farms    where created_at <= ${lastMonthEnd})         as farms_last,
          (select count(*) from visitor_entries where visit_datetime <= ${thisMonthEnd}) as visitors_this,
          (select count(*) from visitor_entries where visit_datetime <= ${lastMonthEnd}) as visitors_last,
          (select count(*) from system_logs where created_at <= ${thisMonthEnd})      as logs_this,
          (select count(*) from system_logs where created_at <= ${lastMonthEnd})      as logs_last;`;
    } catch (queryError) {
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "trendAggregations" },
        queryError
      );
    }

    const totalUsersThisMonth = Number(trendAgg[0]?.users_this ?? BigInt(0));
    const totalUsersLastMonth = Number(trendAgg[0]?.users_last ?? BigInt(0));
    const totalFarmsThisMonth = Number(trendAgg[0]?.farms_this ?? BigInt(0));
    const totalFarmsLastMonth = Number(trendAgg[0]?.farms_last ?? BigInt(0));
    const totalVisitorsThisMonth = Number(
      trendAgg[0]?.visitors_this ?? BigInt(0)
    );
    const totalVisitorsLastMonth = Number(
      trendAgg[0]?.visitors_last ?? BigInt(0)
    );
    const totalLogsThisMonth = Number(trendAgg[0]?.logs_this ?? BigInt(0));
    const totalLogsLastMonth = Number(trendAgg[0]?.logs_last ?? BigInt(0));
    const calculateTrend = (current: number, previous: number) =>
      previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

    const trends = {
      userGrowth: calculateTrend(totalUsersThisMonth, totalUsersLastMonth),
      farmGrowth: calculateTrend(totalFarmsThisMonth, totalFarmsLastMonth),
      visitorGrowth: calculateTrend(
        totalVisitorsThisMonth,
        totalVisitorsLastMonth
      ),
      logGrowth: calculateTrend(totalLogsThisMonth, totalLogsLastMonth),
    };

    const disinfectionGrade = getDisinfectionGrade(disinfectionRate);

    const dashboardStats = {
      totalVisitors: scopedTotalVisitors,
      todayVisitors,
      weeklyVisitors,
      disinfectionRate,
      trends: {
        totalVisitorsTrend: formatTrendPercent(last30Count, prev30Count),
        todayVisitorsTrend: formatDiffCount(todayVisitors, yesterdayVisitors),
        weeklyVisitorsTrend: formatDiffCount(
          weeklyVisitors,
          Math.max(0, weeklyVisitors - todayVisitors)
        ),
        disinfectionTrend: disinfectionGrade,
      },
    };

    // 방문자 차트/분포 관련 5개 쿼리를 병렬 실행
    const visitorTrendPromise = prisma.$queryRaw<
      Array<{ kst_date: string; cnt: bigint }>
    >`
        with days as (
          select ((now() at time zone 'Asia/Seoul')::date + (gs || ' day')::interval)::date as day_kst
          from generate_series(-29, 0) as gs
        )
        select to_char(d.day_kst, 'YYYY-MM-DD') as kst_date,
               coalesce((
                 select count(*)
                 from visitor_entries v
                 where (v.visit_datetime at time zone 'Asia/Seoul')::date = d.day_kst
                   and (${farmIdParam}::uuid is null or v.farm_id = ${farmIdParam}::uuid)
               ), 0) as cnt
        from days d
        order by kst_date;
      `.catch((queryError) =>
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "visitorTrend" },
        queryError
      )
    );

    const purposeAggPromise = prisma.$queryRaw<
      Array<{ category: string | null; cnt: bigint }>
    >`
        select coalesce(nullif(visitor_purpose, ''), '기타') as category, count(*) as cnt
        from visitor_entries
        where visit_datetime between ${last30Start} and ${todayEnd}
          and (${farmIdParam}::uuid is null or farm_id = ${farmIdParam}::uuid)
        group by 1
        order by cnt desc;
      `.catch((queryError) =>
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "visitorPurposeDistribution" },
        queryError
      )
    );

    const hourlyAggPromise = prisma.$queryRaw<
      Array<{ hour: number; cnt: bigint }>
    >`
        select extract(hour from (visit_datetime at time zone 'Asia/Seoul'))::int as hour, count(*) as cnt
        from visitor_entries
        where visit_datetime between ${last30Start} and ${todayEnd}
          and (${farmIdParam}::uuid is null or farm_id = ${farmIdParam}::uuid)
        group by 1
        order by 1;
      `.catch((queryError) =>
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "visitorHourlyDistribution" },
        queryError
      )
    );

    const weekdayAggPromise = prisma.$queryRaw<
      Array<{ dow: number; cnt: bigint }>
    >`
        select extract(dow from (visit_datetime at time zone 'Asia/Seoul'))::int as dow, count(*) as cnt
        from visitor_entries
        where visit_datetime between ${last30Start} and ${todayEnd}
          and (${farmIdParam}::uuid is null or farm_id = ${farmIdParam}::uuid)
        group by 1
        order by 1;
      `.catch((queryError) =>
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "visitorWeekdayDistribution" },
        queryError
      )
    );

    const visitorRegionAggPromise = prisma.$queryRaw<
      Array<{ region: string | null; cnt: bigint }>
    >`
        select coalesce(nullif(split_part(trim(coalesce(visitor_address, '')), ' ', 1), ''), '기타') as region,
               count(*) as cnt
        from visitor_entries
        where visit_datetime between ${last30Start} and ${todayEnd}
          and (${farmIdParam}::uuid is null or farm_id = ${farmIdParam}::uuid)
        group by 1
        order by cnt desc;
      `.catch((queryError) =>
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        { resourceType: "visitorRegionDistribution" },
        queryError
      )
    );

    const [
      visitorTrendAgg,
      purposeAgg,
      hourlyAgg,
      weekdayAgg,
      visitorRegionAgg,
    ] = await Promise.all([
      visitorTrendPromise,
      purposeAggPromise,
      hourlyAggPromise,
      weekdayAggPromise,
      visitorRegionAggPromise,
    ]);

    const visitorTrend = visitorTrendAgg.map((r) => ({
      date: r.kst_date,
      visitors: Number(r.cnt ?? BigInt(0)),
    }));

    const last30Total = last30Count;
    const purposeStats = purposeAgg.map((r) => ({
      category: r.category ?? "기타",
      count: Number(r.cnt ?? BigInt(0)),
      percentage:
        last30Total > 0 ? (Number(r.cnt ?? BigInt(0)) / last30Total) * 100 : 0,
    }));

    const hourlyMap = new Map<number, number>(
      hourlyAgg.map((r) => [r.hour, Number(r.cnt ?? BigInt(0))])
    );
    const timeStats = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      value: hourlyMap.get(h) ?? 0,
    }));

    const weekdayMap = new Map<number, number>(
      weekdayAgg.map((r) => [r.dow, Number(r.cnt ?? BigInt(0))])
    );
    const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
    const weekdayStats = weekdayLabels.map((label, idx) => ({
      label,
      value: weekdayMap.get(idx) ?? 0,
    }));

    const regionStats = visitorRegionAgg.map((r) => ({
      category: r.region ?? "기타",
      count: Number(r.cnt ?? BigInt(0)),
      percentage:
        last30Total > 0 ? (Number(r.cnt ?? BigInt(0)) / last30Total) * 100 : 0,
    }));

    return NextResponse.json({
      totalUsers,
      totalFarms,
      totalVisitors,
      totalLogs,
      trends,
      farmTypeData,
      userRoleData,
      regionData,
      monthlyData,
      systemUsageData,
      recentActivities,
      // 대시보드 카드/차트용 서버 집계 데이터
      dashboardStats,
      visitorTrend,
      purposeStats,
      timeStats,
      weekdayStats,
      regionStats,
    });
  } catch (e: any) {
    devLog.error("[ADMIN_DASHBOARD_STATS] error:", e);
    const result = getErrorResultFromRawError(e, {
      operation: "admin_dashboard_stats",
    });
    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
