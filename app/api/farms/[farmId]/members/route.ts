import { NextRequest, NextResponse } from "next/server";
import { createSystemLog } from "@/lib/utils/logging/system-log";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { requireAuth } from "@/lib/server/auth-utils";
import { getClientIP, getUserAgent } from "@/lib/server/ip-helpers";
import { prisma } from "@/lib/prisma";
import { sendSupabaseBroadcast } from "@/lib/supabase/broadcast";

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

    // 시스템 관리자가 아닌 경우 농장별 권한 체크
    if (!isAdmin) {
      let access;
      try {
        access = await prisma.farms.findUnique({
          where: { id: params.farmId },
          select: { owner_id: true },
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

      if (!access) {
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
      const isOwner = access.owner_id === user.id;
      const isMember = await isFarmMember(params.farmId, user.id);

      if (!isOwner && !isMember) {
        return NextResponse.json(
          {
            success: false,
            error: "ACCESS_DENIED",
            message: "농장 접근 권한이 없습니다.",
          },
          { status: 403 }
        );
      }
    }

    // 멤버 목록 조회
    let members;
    try {
      members = await prisma.farm_members.findMany({
        where: { farm_id: params.farmId },
        include: {
          profiles: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
    } catch (membersError) {
      devLog.error("Error fetching farm members:", membersError);
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_FETCH_ERROR",
          message: "농장 멤버 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

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
      {
        success: false,
        error: "MEMBER_FETCH_ERROR",
        message: "농장 멤버 조회 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// 농장 구성원 여부 확인 헬퍼 함수
async function isFarmMember(farmId: string, userId: string) {
  const data = await prisma.farm_members.findFirst({
    where: {
      farm_id: farmId,
      user_id: userId,
      is_active: true,
    },
    select: { id: true },
  });
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
    let farm;
    try {
      farm = await prisma.farms.findUnique({
        where: { id: params.farmId },
        select: { owner_id: true, farm_name: true },
      });
    } catch (farmError) {
      devLog.error("Error fetching farm:", farmError);
      return NextResponse.json(
        {
          success: false,
          error: "FARM_FETCH_ERROR",
          message: "농장 정보 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

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

    // 권한 확인
    if (!isAdmin && farm.owner_id !== user.id) {
      let memberRole;
      try {
        memberRole = await prisma.farm_members.findFirst({
          where: {
            farm_id: params.farmId,
            user_id: user.id,
          },
          select: { role: true },
        });
      } catch (memberError) {
        devLog.error("Error checking member role:", memberError);
        return NextResponse.json(
          {
            success: false,
            error: "PERMISSION_CHECK_ERROR",
            message: "권한 확인 중 오류가 발생했습니다.",
          },
          { status: 500 }
        );
      }

      if (!memberRole || memberRole.role !== "manager") {
        return NextResponse.json(
          {
            success: false,
            error: "INSUFFICIENT_PERMISSIONS",
            message:
              "멤버 추가 권한이 없습니다. 농장 소유자 또는 관리자만 멤버를 추가할 수 있습니다.",
          },
          { status: 403 }
        );
      }
    }

    // 사용자 프로필 조회
    let userToAdd;
    try {
      userToAdd = await prisma.profiles.findFirst({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          profile_image_url: true,
        },
      });
    } catch (profileError) {
      devLog.error("Error fetching profile:", profileError);
      return NextResponse.json(
        {
          success: false,
          error: "PROFILE_FETCH_ERROR",
          message: "사용자 정보 조회 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (!userToAdd) {
      return NextResponse.json(
        {
          success: false,
          error: "USER_NOT_FOUND",
          message: "추가할 사용자를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 중복 멤버 확인
    let existingMember;
    try {
      existingMember = await prisma.farm_members.findFirst({
        where: {
          farm_id: params.farmId,
          user_id: userToAdd.id,
        },
        select: { id: true },
      });
    } catch (existingError) {
      devLog.error("Error checking existing member:", existingError);
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_CHECK_ERROR",
          message: "멤버 확인 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: "MEMBER_ALREADY_EXISTS",
          message: "이미 농장 멤버로 등록된 사용자입니다.",
        },
        { status: 409 }
      );
    }

    // 새 멤버 추가
    let newMember;
    try {
      newMember = await prisma.farm_members.create({
        data: {
          farm_id: params.farmId,
          user_id: userToAdd.id,
          role: role,
          is_active: true,
        },
        select: { id: true, created_at: true },
      });
    } catch (insertError) {
      devLog.error("Error creating farm member:", insertError);
      throw insertError;
    }

    // 🔥 농장 멤버 추가 실시간 브로드캐스트
    await sendSupabaseBroadcast({
      channel: "member_updates",
      event: "member_created",
      payload: {
        eventType: "INSERT",
        new: {
          id: newMember.id,
          farm_id: params.farmId,
          user_id: userToAdd.id,
          role: role,
          name: userToAdd.name,
          email: userToAdd.email,
        },
        old: null,
        table: "farm_members",
        schema: "public",
      },
    });

    // 농장 멤버 추가 로그 기록
    await createSystemLog(
      "MEMBER_CREATE",
      `농장 멤버 추가: ${userToAdd.name} (${userToAdd.email}) - ${role} 역할 (농장: ${farm.farm_name})`,
      "info",
      user.id,
      "member",
      newMember.id,
      {
        member_id: newMember.id,
        farm_id: params.farmId,
        farm_name: farm.farm_name,
        member_email: userToAdd.email,
        member_name: userToAdd.name,
        member_role: role,
        target_user_id: userToAdd.id,
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
      user_id: userToAdd.id,
      role: role,
      position: null,
      responsibilities: null,
      is_active: true,
      created_at: newMember.created_at,
      updated_at: newMember.created_at,
      profiles: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email,
        profile_image_url: userToAdd.profile_image_url,
      },
    };

    return NextResponse.json(
      {
        success: true,
        member: memberWithProfile,
        message: `${userToAdd.name}이 ${
          role === "manager" ? "관리자" : "조회자"
        }로 추가되었습니다.`,
      },
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
      {
        success: false,
        error: "MEMBER_CREATE_ERROR",
        message: "멤버 추가 중 오류가 발생했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
