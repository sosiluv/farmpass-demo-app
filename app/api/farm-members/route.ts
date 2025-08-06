import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { requireAuth } from "@/lib/server/auth-utils";
import { logSecurityError } from "@/lib/utils/logging/system-log";
import { prisma } from "@/lib/prisma";
import {
  getErrorResultFromRawError,
  makeErrorResponseFromResult,
  throwBusinessError,
} from "@/lib/utils/error/errorUtil";
import { LOG_MESSAGES } from "@/lib/utils/logging/log-templates";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// GET - 여러 농장의 구성원 일괄 조회
export async function GET(request: NextRequest) {
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
      throwBusinessError("MISSING_REQUIRED_FIELDS", {
        missingFields: ["farmIds"],
        operation: "bulk_member_fetch",
      });
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
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "farm",
          },
          accessError
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
        throwBusinessError(
          "GENERAL_QUERY_FAILED",
          {
            resourceType: "member",
          },
          memberError
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
          LOG_MESSAGES.FARM_MEMBER_ACCESS_DENIED(
            user.id,
            unauthorizedFarms.join(", ")
          ),
          { id: user.id, email: user.email || "" },
          request
        );

        throwBusinessError("GENERAL_UNAUTHORIZED", {
          resourceType: "farm",
          operationType: "access",
          multiple: true,
          unauthorizedItems: unauthorizedFarms,
        });
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
      throwBusinessError(
        "GENERAL_QUERY_FAILED",
        {
          resourceType: "memberList",
        },
        membersError
      );
    }

    // 농장 구성원 일괄 조회 로그 기록
    await createSystemLog(
      "MEMBER_BULK_READ",
      LOG_MESSAGES.MEMBER_BULK_READ(members?.length || 0),
      "info",
      { id: user.id, email: user.email || "" },
      "member",
      undefined,
      {
        action_type: "farm_event",
        event: "member_bulk_read",
        count: members?.length || 0,
      },
      request
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
    // 실패 로그 기록
    const errorMessage = error instanceof Error ? error.message : String(error);
    await createSystemLog(
      "MEMBER_BULK_READ_FAILED",
      LOG_MESSAGES.MEMBER_BULK_READ_FAILED(errorMessage),
      "error",
      { id: user.id, email: user.email || "" },
      "member",
      undefined,
      {
        action_type: "farm_event",
        event: "member_bulk_read_failed",
        error_message: errorMessage,
      },
      request
    );

    // 비즈니스 에러 또는 시스템 에러를 표준화된 에러 코드로 매핑
    const result = getErrorResultFromRawError(error, {
      operation: "bulk_member_fetch",
      userId: user.id,
    });

    return NextResponse.json(makeErrorResponseFromResult(result), {
      status: result.status,
    });
  }
}
