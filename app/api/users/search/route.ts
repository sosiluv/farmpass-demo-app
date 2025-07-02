import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logUserActivity } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const farmId = searchParams.get("farmId");

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 농장 ID가 제공된 경우, 해당 농장의 소유자/구성원인지 확인
    if (farmId) {
      const { data: farm } = await supabase
        .from("farms")
        .select("owner_id")
        .eq("id", farmId)
        .single();

      if (!farm) {
        return NextResponse.json({ error: "Farm not found" }, { status: 404 });
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
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
    await logUserActivity(
      "USER_SEARCH",
      `사용자 검색: "${query}" (${filteredUsers.length}건 결과)`,
      user.id,
      {
        search_query: query,
        farm_id: farmId,
        result_count: filteredUsers.length,
        search_context: farmId ? "farm_member_search" : "general_search",
      }
    );

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    devLog.error("Error searching users:", error);

    // 검색 실패 로그 기록
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await logUserActivity(
          "USER_SEARCH_FAILED",
          `사용자 검색 실패: ${
            error instanceof Error ? error.message : String(error)
          }`,
          user.id,
          {
            search_query: new URL(request.url).searchParams.get("q"),
            farm_id: new URL(request.url).searchParams.get("farmId"),
            error_message:
              error instanceof Error ? error.message : String(error),
          }
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
