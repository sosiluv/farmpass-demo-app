import { NextResponse, NextRequest } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { prisma } from "@/lib/prisma";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 클라이언트 정보 추출
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
    const query = searchParams.get("q");
    const farmId = searchParams.get("farmId");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // 농장 ID가 제공된 경우, 해당 농장에 대한 접근 권한 확인
    if (farmId) {
      // 시스템 관리자가 아닌 경우에만 농장별 권한 확인
      if (!isAdmin) {
        const farm = await prisma.farms.findUnique({
          where: {
            id: farmId,
          },
          select: {
            owner_id: true,
          },
        });

        if (!farm) {
          return NextResponse.json(
            {
              success: false,
              error: "FARM_NOT_FOUND",
              message: "농장을 찾을 수 없습니다.",
            },
            { status: 404 }
          );
        }

        // 농장 소유자이거나 구성원인지 확인
        const membership = await prisma.farm_members.findFirst({
          where: {
            farm_id: farmId,
            user_id: user.id,
          },
          select: {
            role: true,
          },
        });

        const isOwner = farm.owner_id === user.id;
        const isMember = !!membership;

        if (!isOwner && !isMember) {
          // 권한 거부 로그(warn)
          await createSystemLog(
            "USER_SEARCH_UNAUTHORIZED",
            `농장 멤버/소유자 아님: userId=${user.id}, farmId=${farmId}`,
            "warn",
            user.id,
            "user",
            undefined,
            {
              farm_id: farmId,
              attempted_user_id: user.id,
              reason: "not_owner_or_member",
              action_type: "user_search",
            },
            user.email,
            clientIP,
            userAgent
          );
          return NextResponse.json(
            {
              success: false,
              error: "USER_SEARCH_UNAUTHORIZED",
              message: "사용자 검색 권한이 없습니다.",
            },
            { status: 403 }
          );
        }
      }
    }

    // 사용자 검색 (이메일, 이름으로 검색)
    const users = await prisma.profiles.findMany({
      where: {
        OR: [
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    });

    // 농장 ID가 제공된 경우, 이미 해당 농장의 구성원인 사용자 제외
    let filteredUsers = users || [];
    if (farmId) {
      const existingMembers = await prisma.farm_members.findMany({
        where: {
          farm_id: farmId,
        },
        select: {
          user_id: true,
        },
      });

      const memberUserIds = new Set(
        existingMembers?.map((m: any) => m.user_id) || []
      );

      filteredUsers = filteredUsers.filter(
        (user: any) => !memberUserIds.has(user.id)
      );
    }

    // 사용자 검색 로그 기록
    await createSystemLog(
      "USER_SEARCH",
      `사용자 검색: "${query}" (${filteredUsers.length}건 결과)`,
      "info",
      user.id,
      "user",
      undefined,
      {
        search_query: query,
        farm_id: farmId,
        result_count: filteredUsers.length,
        search_context: farmId ? "farm_member_search" : "general_search",
        action_type: "user_search",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { users: filteredUsers },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error searching users:", error);

    // 검색 실패 로그 기록
    try {
      if (user) {
        await createSystemLog(
          "USER_SEARCH_FAILED",
          `사용자 검색 실패: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "error",
          user.id,
          "user",
          undefined,
          {
            error_message:
              error instanceof Error ? error.message : String(error),
            search_query: new URL(request.url).searchParams.get("q"),
            farm_id: new URL(request.url).searchParams.get("farmId"),
            action_type: "user_search",
          },
          user.email,
          clientIP,
          userAgent
        );
      }
    } catch (logError) {
      devLog.error("Failed to log search error:", logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: "USER_SEARCH_FAILED",
        message: "사용자 검색 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
