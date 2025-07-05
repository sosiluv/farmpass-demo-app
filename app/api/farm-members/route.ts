import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logDataChange } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// GET - 여러 농장의 구성원 일괄 조회
export async function GET(request: NextRequest) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    const { searchParams } = new URL(request.url);
    const farmIds = searchParams.get("farmIds");

    if (!farmIds) {
      return NextResponse.json(
        { error: "farmIds parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 시스템 관리자 체크
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();

    const farmIdArray = farmIds.split(",").filter(Boolean);

    // 시스템 관리자가 아닌 경우 권한 체크
    if (profile?.account_type !== "admin") {
      // 사용자가 접근할 수 있는 농장들만 필터링
      const { data: accessibleFarms, error: accessError } = await supabase
        .from("farms")
        .select("id")
        .or(`owner_id.eq.${user.id},id.in.(${farmIdArray.join(",")})`);

      if (accessError) {
        devLog.error("Error checking farm access:", accessError);
        return NextResponse.json(
          { error: "Failed to check farm access" },
          { status: 500 }
        );
      }

      // 농장 구성원으로서 접근 가능한 농장들도 확인
      const { data: memberFarms, error: memberError } = await supabase
        .from("farm_members")
        .select("farm_id")
        .eq("user_id", user.id)
        .in("farm_id", farmIdArray);

      if (memberError) {
        devLog.error("Error checking farm membership:", memberError);
        return NextResponse.json(
          { error: "Failed to check farm membership" },
          { status: 500 }
        );
      }

      const accessibleFarmIds = new Set([
        ...(accessibleFarms?.map((f) => f.id) || []),
        ...(memberFarms?.map((f) => f.farm_id) || []),
      ]);

      // 접근 권한이 없는 농장이 있으면 에러
      const unauthorizedFarms = farmIdArray.filter(
        (farmId) => !accessibleFarmIds.has(farmId)
      );

      if (unauthorizedFarms.length > 0) {
        return NextResponse.json(
          {
            error: "Access denied to some farms",
            unauthorized_farms: unauthorizedFarms,
          },
          { status: 403 }
        );
      }
    }

    // 구성원 목록 일괄 조회
    const { data: members, error: membersError } = await supabase
      .from("farm_members")
      .select(
        `
        id,
        farm_id,
        user_id,
        role,
        is_active,
        created_at,
        updated_at,
        position,
        responsibilities,
        profiles (
          id,
          name,
          email,
          profile_image_url
        )
      `
      )
      .in("farm_id", farmIdArray)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (membersError) {
      devLog.error("Error fetching farm members:", membersError);
      throw membersError;
    }

    // 농장 구성원 일괄 조회 로그 기록
    await logDataChange(
      "MEMBER_BULK_READ",
      "MEMBER",
      user.id,
      {
        farm_ids: farmIdArray,
        member_count: members?.length || 0,
        action_type: "bulk_member_fetch",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent: userAgent,
      }
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

    // 실패 로그 기록 (새로운 supabase 클라이언트 생성)
    try {
      const errorSupabase = await createClient();
      const {
        data: { user: errorUser },
      } = await errorSupabase.auth.getUser();
      await logDataChange(
        "MEMBER_BULK_READ_FAILED",
        "MEMBER",
        errorUser?.id,
        {
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          action_type: "bulk_member_fetch",
          status: "failed",
        },
        {
          ip: clientIP,
          userAgent: userAgent,
        }
      );
    } catch (logError) {
      devLog.error("Failed to log bulk member fetch error:", logError);
    }

    return NextResponse.json(
      { error: "Failed to fetch farm members" },
      { status: 500 }
    );
  }
}
