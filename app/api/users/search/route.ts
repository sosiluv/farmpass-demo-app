import { createClient } from "@/lib/supabase/server";
import { NextResponse, NextRequest } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

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
    const supabase = await createClient();
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
        const { data: farm } = await supabase
          .from("farms")
          .select("owner_id")
          .eq("id", farmId)
          .single();

        if (!farm) {
          return NextResponse.json(
            { error: "Farm not found" },
            { status: 404 }
          );
        }

        // 농장 소유자이거나 구성원인지 확인
        const { data: membership } = await supabase
          .from("farm_members")
          .select("role")
          .eq("farm_id", farmId)
          .eq("user_id", user.id)
          .single();

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
              action: "user_search",
              reason: "not_owner_or_member",
            },
            user.email,
            clientIP,
            userAgent
          );
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    }

    // 사용자 검색 (이메일, 이름으로 검색)
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, name, email")
      .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      throw error;
    }

    // 농장 ID가 제공된 경우, 이미 해당 농장의 구성원인 사용자 제외
    let filteredUsers = users || [];
    if (farmId) {
      const { data: existingMembers } = await supabase
        .from("farm_members")
        .select("user_id")
        .eq("farm_id", farmId);

      const memberUserIds = new Set(
        existingMembers?.map((m) => m.user_id) || []
      );

      filteredUsers = filteredUsers.filter(
        (user) => !memberUserIds.has(user.id)
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
            search_query: new URL(request.url).searchParams.get("q"),
            farm_id: new URL(request.url).searchParams.get("farmId"),
            error_message:
              error instanceof Error ? error.message : String(error),
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
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
