import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// GET - 농장 멤버 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // 인증된 사용자 확인
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const user = authResult.user;
    const isAdmin = authResult.isAdmin || false;
    const supabase = await createClient();

    // 시스템 관리자가 아닌 경우 농장별 권한 체크
    if (!isAdmin) {
      const { data: access } = await supabase
        .from("farms")
        .select("owner_id")
        .eq("id", params.farmId)
        .single();

      if (
        !access ||
        (access.owner_id !== user.id &&
          !(await isFarmMember(supabase, params.farmId, user.id)))
      ) {
        return NextResponse.json(
          { error: "접근이 거절되었습니다." },
          { status: 403 }
        );
      }
    }

    // 멤버 목록 조회
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
      .eq("farm_id", params.farmId);

    if (membersError) throw membersError;

    // 농장 멤버 조회 로그 기록
    await createSystemLog(
      "MEMBER_READ",
      `농장 멤버 조회: ${members?.length || 0}명 (농장 ID: ${params.farmId})`,
      "info",
      user.id,
      "member",
      undefined,
      {
        farm_id: params.farmId,
        member_count: members?.length || 0,
        action_type: "member_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    return NextResponse.json(
      { members },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error fetching farm members:", error);

    // 농장 멤버 조회 실패 로그 기록
    await createSystemLog(
      "MEMBER_READ_FAILED",
      `농장 멤버 조회 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (농장 ID: ${params.farmId})`,
      "error",
      undefined,
      "member",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        action_type: "member_management",
        status: "failed",
      },
      undefined,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log member fetch error:", logError)
    );

    return NextResponse.json(
      { error: "멤버 조회에 실패했습니다." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// 농장 구성원 여부 확인 헬퍼 함수
async function isFarmMember(supabase: any, farmId: string, userId: string) {
  const { data } = await supabase
    .from("farm_members")
    .select("id")
    .eq("farm_id", farmId)
    .eq("user_id", userId)
    .single();

  return !!data;
}

// POST - 농장 멤버 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { farmId: string } }
) {
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);
  let user: any = null;

  try {
    const supabase = await createClient();
    // 인증된 사용자 확인
    // 인증 확인
    const authResult = await requireAuth(false);
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    user = authResult.user;
    const isAdmin = authResult.isAdmin || false;
    const { email, role } = await request.json();

    // 농장 소유권, 농장 관리자 권한, 또는 시스템 관리자 권한 확인
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("owner_id, farm_name")
      .eq("id", params.farmId)
      .single();

    if (farmError || !farm) {
      return NextResponse.json(
        { error: "농장을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 확인: 시스템 관리자, 농장 소유자, 또는 농장 관리자
    if (!isAdmin && farm.owner_id !== user.id) {
      const { data: memberRole } = await supabase
        .from("farm_members")
        .select("role")
        .eq("farm_id", params.farmId)
        .eq("user_id", user.id)
        .single();

      if (!memberRole || memberRole.role !== "manager") {
        return NextResponse.json(
          {
            error:
              "농장 소유자, 농장 관리자 또는 시스템 관리자만 구성원을 추가할 수 있습니다.",
          },
          { status: 403 }
        );
      }
    }

    // 사용자 프로필 조회
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name, profile_image_url")
      .eq("email", email.toLowerCase())
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: "이메일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 중복 멤버 확인
    const { data: existingMember } = await supabase
      .from("farm_members")
      .select("id")
      .eq("farm_id", params.farmId)
      .eq("user_id", profileData.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "이미 농장의 구성원입니다." },
        { status: 409 }
      );
    }

    // 새 멤버 추가
    const { data: newMember, error: insertError } = await supabase
      .from("farm_members")
      .insert({
        farm_id: params.farmId,
        user_id: profileData.id,
        role: role,
        is_active: true,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    // 농장 멤버 추가 로그 기록
    await createSystemLog(
      "MEMBER_CREATE",
      `농장 멤버 추가: ${profileData.name} (${profileData.email}) - ${role} 역할 (농장: ${farm.farm_name})`,
      "info",
      user.id,
      "member",
      newMember.id,
      {
        member_id: newMember.id,
        farm_id: params.farmId,
        farm_name: farm.farm_name,
        member_email: profileData.email,
        member_name: profileData.name,
        member_role: role,
        target_user_id: profileData.id,
        action_type: "member_management",
      },
      user.email,
      clientIP,
      userAgent
    );

    // 응답용 멤버 데이터 구성
    const memberWithProfile = {
      id: newMember.id,
      farm_id: params.farmId,
      user_id: profileData.id,
      role: role,
      position: null,
      responsibilities: null,
      is_active: true,
      created_at: newMember.created_at,
      updated_at: newMember.created_at,
      profiles: {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        profile_image_url: profileData.profile_image_url,
      },
    };

    return NextResponse.json(
      { member: memberWithProfile },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error adding farm member:", error);

    // 농장 멤버 추가 실패 로그 기록
    await createSystemLog(
      "MEMBER_CREATE_FAILED",
      `농장 멤버 추가 실패: ${
        error instanceof Error ? error.message : "Unknown error"
      } (농장 ID: ${params.farmId})`,
      "error",
      user?.id,
      "member",
      undefined,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        action_type: "member_management",
        status: "failed",
      },
      user?.email,
      clientIP,
      userAgent
    ).catch((logError: any) =>
      devLog.error("Failed to log member addition error:", logError)
    );

    return NextResponse.json(
      { error: "멤버 추가에 실패했습니다." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
