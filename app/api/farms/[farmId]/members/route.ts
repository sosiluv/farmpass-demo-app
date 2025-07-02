import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logDataChange } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";

// 구성원 추가 후 사용자 role 업데이트 함수
async function updateUserRoleAfterMemberAdd(
  supabase: any,
  userId: string,
  newMemberRole: string
) {
  try {
    // 1. 현재 사용자의 role 조회
    const { data: currentUser, error: userError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError) {
      devLog.error("사용자 정보 조회 오류:", userError);
      return;
    }

    // 2. 사용자가 소유한 농장 확인
    const { data: ownedFarms, error: ownedError } = await supabase
      .from("farms")
      .select("id")
      .eq("owner_id", userId);

    if (ownedError) {
      devLog.error("소유 농장 조회 오류:", ownedError);
      return;
    }

    // 3. 농장 구성원 추가 시 profiles.role 업데이트는 더 이상 필요하지 않음
    // 새로운 권한 시스템에서는 profiles.account_type은 시스템 레벨 권한만 관리
    // 농장별 권한은 farm_members 테이블에서 관리됨
  } catch (error) {
    devLog.error("구성원 추가 후 role 업데이트 오류:", error);
  }
}

// GET - 농장 멤버 목록 조회
export async function GET(
  request: Request,
  { params }: { params: { farmId: string } }
) {
  try {
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

    // 시스템 관리자가 아니고 농장 소유자도 아닌 경우 권한 체크
    if (profile?.account_type !== "admin") {
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
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    await logDataChange("MEMBER_READ", "MEMBER", user.id, {
      farm_id: params.farmId,
      member_count: members?.length || 0,
      action_type: "member_management",
    });

    return NextResponse.json({ members });
  } catch (error) {
    devLog.error("Error fetching farm members:", error);

    // 농장 멤버 조회 실패 로그 기록
    await logDataChange("MEMBER_READ_FAILED", "MEMBER", undefined, {
      error_message: error instanceof Error ? error.message : "Unknown error",
      farm_id: params.farmId,
      action_type: "member_management",
      status: "failed",
    }).catch((logError) =>
      devLog.error("Failed to log member fetch error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
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
  request: Request,
  { params }: { params: { farmId: string } }
) {
  let user: any = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    user = authUser;
    const { email, role } = await request.json();

    // 농장 소유권 또는 관리자 권한 확인
    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("owner_id, farm_name")
      .eq("id", params.farmId)
      .single();

    if (farmError || !farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    // 소유자가 아닌 경우 관리자 권한 확인
    if (farm.owner_id !== user.id) {
      const { data: memberRole } = await supabase
        .from("farm_members")
        .select("role")
        .eq("farm_id", params.farmId)
        .eq("user_id", user.id)
        .single();

      if (!memberRole || memberRole.role !== "manager") {
        return NextResponse.json(
          { error: "Only farm owners and managers can add members" },
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
        { error: "User not found with this email" },
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
        { error: "User is already a member of this farm" },
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
    await logDataChange("MEMBER_CREATE", "MEMBER", user.id, {
      member_id: newMember.id,
      farm_id: params.farmId,
      farm_name: farm.farm_name,
      member_email: profileData.email,
      member_name: profileData.name,
      member_role: role,
      target_user_id: profileData.id,
      action_type: "member_management",
    });

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

    return NextResponse.json({ member: memberWithProfile }, { status: 201 });
  } catch (error) {
    devLog.error("Error adding farm member:", error);

    // 농장 멤버 추가 실패 로그 기록
    await logDataChange("MEMBER_CREATE_FAILED", "MEMBER", user?.id, {
      error_message: error instanceof Error ? error.message : "Unknown error",
      farm_id: params.farmId,
      action_type: "member_management",
      status: "failed",
    }).catch((logError) =>
      devLog.error("Failed to log member addition error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
