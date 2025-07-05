import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logDataChange } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";

// PUT - 농장 멤버 역할 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: { farmId: string; memberId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

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
    const { role } = await request.json();

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
          { error: "Only farm owners and managers can change member roles" },
          { status: 403 }
        );
      }
    }

    // 변경할 멤버 정보 조회
    const { data: memberToUpdate, error: memberError } = await supabase
      .from("farm_members")
      .select(
        `
        id,
        farm_id,
        user_id,
        role,
        profiles!farm_members_user_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("id", params.memberId)
      .eq("farm_id", params.farmId)
      .single();

    if (memberError || !memberToUpdate) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 농장 소유자의 역할은 변경할 수 없음
    if (memberToUpdate.user_id === farm.owner_id) {
      return NextResponse.json(
        { error: "Cannot change farm owner's role" },
        { status: 400 }
      );
    }

    const oldRole = memberToUpdate.role;

    // 멤버 역할 업데이트
    const { error: updateError } = await supabase
      .from("farm_members")
      .update({ role })
      .eq("id", params.memberId);

    if (updateError) {
      throw updateError;
    }

    // 농장 멤버 역할 변경 로그 기록
    await logDataChange(
      "MEMBER_UPDATE",
      "MEMBER",
      user.id,
      {
        member_id: params.memberId,
        farm_id: params.farmId,
        farm_name: farm.farm_name,
        member_email: (memberToUpdate.profiles as any)?.email,
        member_name: (memberToUpdate.profiles as any)?.name,
        old_role: oldRole,
        new_role: role,
        target_user_id: memberToUpdate.user_id,
        action_type: "member_management",
      },
      {
        ip: clientIP,
        email: user.email,
        userAgent: userAgent,
      }
    );

    return NextResponse.json(
      {
        message: "Member role updated successfully",
        member: {
          ...memberToUpdate,
          role: role,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error updating member role:", error);

    // 농장 멤버 역할 변경 실패 로그 기록
    await logDataChange(
      "MEMBER_UPDATE_FAILED",
      "MEMBER",
      user?.id,
      {
        error_message: error instanceof Error ? error.message : "Unknown error",
        farm_id: params.farmId,
        member_id: params.memberId,
        action_type: "member_management",
        status: "failed",
      },
      {
        ip: clientIP,
        userAgent: userAgent,
      }
    ).catch((logError) =>
      devLog.error("Failed to log member role update error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE - 농장 멤버 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: { farmId: string; memberId: string } }
) {
  // 요청 컨텍스트 정보 추출
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

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
          { error: "Only farm owners and managers can remove members" },
          { status: 403 }
        );
      }
    }

    // 삭제할 멤버 정보 조회
    const { data: memberToRemove, error: memberError } = await supabase
      .from("farm_members")
      .select(
        `
        id,
        farm_id,
        user_id,
        role,
        profiles!farm_members_user_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("id", params.memberId)
      .eq("farm_id", params.farmId)
      .single();

    if (memberError || !memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 농장 소유자는 제거할 수 없음
    if (memberToRemove.user_id === farm.owner_id) {
      return NextResponse.json(
        { error: "Cannot remove farm owner" },
        { status: 400 }
      );
    }

    // 멤버 삭제
    const { error: deleteError } = await supabase
      .from("farm_members")
      .delete()
      .eq("id", params.memberId);

    if (deleteError) {
      throw deleteError;
    }

    // 농장 멤버 제거 로그 기록
    await logDataChange("MEMBER_DELETE", "MEMBER", user.id, {
      member_id: params.memberId,
      farm_id: params.farmId,
      farm_name: farm.farm_name,
      member_email: (memberToRemove.profiles as any)?.email,
      member_name: (memberToRemove.profiles as any)?.name,
      member_role: memberToRemove.role,
      target_user_id: memberToRemove.user_id,
      action_type: "member_management",
    });

    return NextResponse.json(
      {
        message: "Member removed successfully",
        removedMember: memberToRemove,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    devLog.error("Error removing member:", error);

    // 농장 멤버 제거 실패 로그 기록
    await logDataChange("MEMBER_DELETE_FAILED", "MEMBER", user?.id, {
      error_message: error instanceof Error ? error.message : "Unknown error",
      farm_id: params.farmId,
      member_id: params.memberId,
      action_type: "member_management",
      status: "failed",
    }).catch((logError) =>
      devLog.error("Failed to log member removal error:", logError)
    );

    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
