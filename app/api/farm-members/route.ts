import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { requireAuth } from "@/lib/server/auth-utils";
import { logApiError, logSecurityError } from "@/lib/utils/logging/system-log";
import { prisma } from "@/lib/prisma";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// GET - 여러 농장의 구성원 일괄 조회
export async function GET(request: NextRequest) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // 인증 확인
  const authResult = await requireAuth(false);
  if (!authResult.success || !authResult.user) {
    return authResult.response!;
  }

  const user = authResult.user;
  const isAdmin = authResult.isAdmin || false;

  try {
    const { searchParams } = new URL(request.url);
    const farmIds = searchParams.get("farmIds");

    if (!farmIds || farmIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FARM_IDS",
          message: "농장 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const farmIdArray = farmIds.split(",").filter(Boolean);

    // 시스템 관리자가 아닌 경우 권한 체크
    if (!isAdmin) {
      let accessibleFarms;
      let memberFarms;

      try {
        // 사용자가 접근할 수 있는 농장들만 필터링
        accessibleFarms = await prisma.farms.findMany({
          where: {
            OR: [{ owner_id: user.id }, { id: { in: farmIdArray } }],
          },
          select: {
            id: true,
          },
        });
      } catch (accessError) {
        devLog.error("Error checking farm access:", accessError);
        return NextResponse.json(
          {
            success: false,
            error: "FARM_ACCESS_CHECK_ERROR",
            message: "농장 접근 권한 확인 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      try {
        // 농장 구성원으로서 접근 가능한 농장들도 확인
        memberFarms = await prisma.farm_members.findMany({
          where: {
            user_id: user.id,
            farm_id: { in: farmIdArray },
          },
          select: {
            farm_id: true,
          },
        });
      } catch (memberError) {
        devLog.error("Error checking farm membership:", memberError);
        return NextResponse.json(
          {
            success: false,
            error: "FARM_MEMBER_ACCESS_CHECK_ERROR",
            message: "농장 구성원 접근 권한 확인 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      const accessibleFarmIds = new Set([
        ...accessibleFarms.map((f: any) => f.id),
        ...memberFarms.map((f: any) => f.farm_id),
      ]);

      // 접근 권한이 없는 농장이 있으면 에러
      const unauthorizedFarms = farmIdArray.filter(
        (farmId) => !accessibleFarmIds.has(farmId)
      );

      if (unauthorizedFarms.length > 0) {
        // 권한 거부 보안 로그
        await logSecurityError(
          "FARM_MEMBER_ACCESS_DENIED",
          `농장 구성원 조회 권한 거부: 사용자 ${
            user.id
          }가 농장 ${unauthorizedFarms.join(", ")}에 대한 접근 시도`,
          user.id,
          clientIP,
          userAgent
        );

        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED_FARMS",
            message: "일부 농장에 대한 접근 권한이 없습니다.",
          },
          { status: 403 }
        );
      }
    }

    // 구성원 목록 일괄 조회
    let members;
    try {
      members = await prisma.farm_members.findMany({
        where: {
          farm_id: { in: farmIdArray },
          is_active: true,
        },
        include: {
          profiles: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image_url: true,
              avatar_seed: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
    } catch (membersError) {
      devLog.error("Error fetching farm members:", membersError);
      return NextResponse.json(
        {
          success: false,
          error: "FARM_MEMBERS_FETCH_ERROR",
          message: "농장 멤버 목록 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 농장 구성원 일괄 조회 로그 기록
    await createSystemLog(
      "MEMBER_BULK_READ",
      `농장 구성원 일괄 조회 성공: ${members?.length || 0}명`,
      "info",
      user.id,
      "member",
      undefined,
      {
        farm_ids: farmIdArray,
        member_count: members?.length || 0,
        action_type: "bulk_member_fetch",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      {
        members: members || [],
        farm_ids: farmIdArray,
        total_count: members?.length || 0,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error in bulk farm members fetch:", error);

    // API 에러 로깅
    await logApiError(
      "/api/farm-members",
      "GET",
      error instanceof Error ? error : String(error),
      user.id,
      {
        ip: clientIP,
        userAgent,
      }
    );

    // 실패 로그 기록 (error 레벨로 변경)
    try {
      await createSystemLog(
        "MEMBER_BULK_READ_FAILED",
        `농장 구성원 일괄 조회 실패: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        user.id,
        "member",
        undefined,
        {
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          action_type: "bulk_member_fetch",
        },
        user.email,
        clientIP,
        userAgent
      );
    } catch (logError) {
      devLog.error("Failed to log bulk member fetch error:", logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: "MEMBER_BULK_READ_FAILED",
        message: "농장 멤버 일괄 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
